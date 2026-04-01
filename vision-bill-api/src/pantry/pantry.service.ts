import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PantryItem, PantryItemDocument } from './schemas/pantry-item.schema';
import { Scan, ScanDocument } from '../scans/schemas/scan.schema';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

import { CacheService } from './cache.service';
import { UserService } from '../auth/user.service';
import { NotificationService } from '../auth/notification.service';
import { BillItemDto } from '../common-types';
import { SCAN_LIMITS, CACHE_TTL, NOTIFICATION_STRINGS, PANTRY_CONFIG } from '../common/constants';

@Injectable()
export class PantryService {
  private readonly logger = new Logger(PantryService.name);

  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(
    @InjectModel(PantryItem.name) private pantryModel: Model<PantryItemDocument>,
    @InjectModel(Scan.name) private scanModel: Model<ScanDocument>,
    private cacheService: CacheService,
    private configService: ConfigService,
    private userService: UserService,
    private notificationService: NotificationService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.genAI = new GoogleGenerativeAI(apiKey || 'stub-key');
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async indexScannedItems(userId: string, items: BillItemDto[]): Promise<void> {
    if (items.length === 0) return;
    this.logger.log(`Indexing ${items.length} items for user ${userId}`);

    const itemNames = items.map(i => i.cleanName);
    const existingItems = await this.pantryModel.find({ userId, cleanName: { $in: itemNames } }).exec();
    const existingMap = new Map(existingItems.map(i => [i.cleanName, i]));

    // Collect spike notifications to send after bulkWrite; avoids per-spike user lookups
    const spikes: { name: string; prev: number; next: number; pct: number }[] = [];

    const bulkOps = items.map(item => {
      const existing = existingMap.get(item.cleanName);
      const now = new Date();

      if (existing) {
        const lastEntry = existing.priceHistory[existing.priceHistory.length - 1];
        const isSameDay = lastEntry && new Date(lastEntry.date).toDateString() === now.toDateString();

        const updateDoc: any = {
          $set: {
            currentPrice: item.price,
            lastPrice: existing.currentPrice,
            updatedAt: now,
          }
        };

        if (!isSameDay || lastEntry.price !== item.price) {
          updateDoc.$push = {
            priceHistory: {
              $each: [{ date: now, price: item.price }],
              $slice: -SCAN_LIMITS.PRICE_HISTORY_COUNT
            }
          };

          const pct = existing.currentPrice ? ((item.price - existing.currentPrice) / existing.currentPrice) * 100 : 0;
          if (pct > SCAN_LIMITS.PRICE_SPIKE_THRESHOLD_PERCENT) {
            spikes.push({ name: item.cleanName, prev: existing.currentPrice, next: item.price, pct });
          }
        }

        return {
          updateOne: {
            filter: { _id: existing._id },
            update: updateDoc,
          }
        };
      } else {
        return {
          insertOne: {
            document: {
              userId,
              cleanName: item.cleanName,
              shorthand: item.shorthand,
              category: item.category,
              currentPrice: item.price,
              unit: item.unit,
              priceHistory: [{ date: now, price: item.price }],
              createdAt: now,
              updatedAt: now,
            }
          }
        };
      }
    });

    await this.pantryModel.bulkWrite(bulkOps as any);

    // Invalidate all paginated pantry cache entries + stats + recipes for this user
    await Promise.all([
      this.cacheService.del(`stats:${userId}`),
      this.cacheService.del(`recipes:${userId}`),
      this.cacheService.delByPattern(`pantry:${userId}:*`),
    ]);

    // Single user lookup for all spikes (B13: hoisted out of per-item loop)
    if (spikes.length > 0) {
      this.sendSpikeNotifications(userId, spikes);
    }
  }

  async getPantryItems(userId: string, limit = 50, page = 1) {
    const clampedLimit = Math.min(Math.max(limit, 1), 100);
    const clampedPage = Math.max(page, 1);
    const cacheKey = `pantry:${userId}:${clampedLimit}:${clampedPage}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const items = await this.pantryModel
      .find({ userId })
      .sort({ updatedAt: -1 })
      .skip((clampedPage - 1) * clampedLimit)
      .limit(clampedLimit)
      .exec();
    await this.cacheService.set(cacheKey, items, CACHE_TTL.PANTRY);
    return items;
  }

  async getStats(userId: string) {
    const cacheKey = `stats:${userId}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    // Use aggregation for volume/heavy data
    const [facetResult, savingsData, itemsCount] = await Promise.all([
      // $facet keeps totalSpent and byCategory in separate pipelines so $unwind
      // does not cause extractedTotal to be counted once per item
      this.scanModel.aggregate([
        { $match: { userId, status: 'completed' } },
        {
          $facet: {
            totals: [
              { $group: { _id: null, totalSpent: { $sum: '$extractedTotal' } } },
            ],
            categories: [
              { $unwind: { path: '$items', preserveNullAndEmptyArrays: false } },
              { $group: { _id: '$items.category', total: { $sum: '$items.price' } } },
            ],
          },
        },
      ]).exec(),
      this.pantryModel.aggregate([
        { $match: { userId } },
        {
          $project: {
            savings: {
              $subtract: [
                { $max: '$priceHistory.price' },
                '$currentPrice'
              ]
            }
          }
        },
        { $match: { savings: { $gt: 0 } } },
        { $group: { _id: null, totalSavings: { $sum: '$savings' } } }
      ]).exec(),
      this.pantryModel.countDocuments({ userId }),
    ]);

    // Format aggregate results
    const totalSpent = facetResult[0]?.totals?.[0]?.totalSpent || 0;
    const savings = savingsData[0]?.totalSavings || 0;
    const byCategory: { [key: string]: number } = {};
    (facetResult[0]?.categories || []).forEach(({ _id, total }: { _id: string; total: number }) => {
      if (_id) byCategory[_id] = total;
    });
    
    // Streaks and Badges need recent data
    const recentScans = await this.scanModel.find({ userId, status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(50) // Limit memory for streak
      .select('createdAt')
      .exec();

    const scanStreak = this.computeStreak(recentScans.map(s => (s as any).createdAt));

    const badges: { emoji: string; label: string }[] = [];
    if (scanStreak >= 3) badges.push({ emoji: '🔥', label: `${scanStreak} Day Streak` });
    if (savings >= 200)  badges.push({ emoji: '🏆', label: 'Top Saver' });
    if (itemsCount >= 50) badges.push({ emoji: '🥦', label: 'Pantry Master' });

    const stats = {
      totalSpent,
      savings,
      itemCount: itemsCount,
      byCategory,
      scanStreak,
      badges,
    };

    await this.cacheService.set(cacheKey, stats, CACHE_TTL.STATS);
    return stats;
  }

  private async sendSpikeNotifications(
    userId: string,
    spikes: { name: string; prev: number; next: number; pct: number }[],
  ) {
    try {
      const user = await this.userService.findById(userId);
      if (!user?.pushToken) return;
      // Send one notification per spike (fire-and-forget, single user fetch)
      for (const { name, prev, next, pct } of spikes) {
        await this.notificationService.sendNotification(
          user.pushToken,
          NOTIFICATION_STRINGS.PRICE_HIKE_ALERT,
          `${name} went up +${pct.toFixed(0)}% (₹${prev} → ₹${next})`,
          { type: 'price_spike', itemName: name, prevPrice: prev, newPrice: next },
        );
      }
    } catch {
      // Non-blocking — silent failure if user not found or token missing
    }
  }

  private computeStreak(dates: Date[]): number {
    const scanDays = new Set(
      dates.map(d => new Date(d).toDateString())
    );
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      if (scanDays.has(d.toDateString())) {
        streak++;
      } else if (i > 0) {
        break; // gap found — streak ends
      }
    }
    return streak;
  }

  async getWeeklyTrend(userId: string) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Use server-side aggregation instead of loading all scan docs into Node memory
    const grouped = await this.scanModel.aggregate([
      { $match: { userId, status: 'completed', createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$extractedTotal' },
        },
      },
    ]).exec();

    const totalsMap = new Map<string, number>(grouped.map((r: any) => [r._id, r.total]));
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD matches $dateToString format
      return { day: dayLabels[d.getDay()], total: totalsMap.get(dateStr) || 0 };
    });
  }

  async suggestRecipes(userId: string) {
    const cacheKey = `recipes:${userId}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const items = await this.pantryModel.find({ userId }).exec();
    if (items.length === 0) return [];

    const itemNames = items.map(i => i.cleanName).join(', ');

    const prompt = `
      You are a world-class chef. I have the following ingredients in my digital pantry based on receipts I scanned recently:
      [${itemNames}]

      Please suggest ${PANTRY_CONFIG.RECIPE_PROMPT_COUNT} different, creative recipes I can make using primarily these ingredients. You can assume I have basic pantry staples like oil, salt, and pepper.
      
      Return ONLY a pure JSON array containing ${PANTRY_CONFIG.RECIPE_PROMPT_COUNT} objects with the following exact structure:
      [
        {
          "title": "Recipe Name",
          "time": "15 mins",
          "difficulty": "Easy",
          "ingredients": ["1 cup Rice", "2 Tomatoes (from pantry)", "Salt"],
          "instructions": ["Step 1...", "Step 2..."]
        }
      ]

      Important: Do not include any markdown formatting, backticks, or explanatory text. Return the JSON array directly.
    `;

    try {
      if (!this.configService.get<string>('GEMINI_API_KEY') || this.configService.get<string>('GEMINI_API_KEY') === 'mock-gemini-key') {
        const mock = [
          { title: "Mock Tomato Soup", time: "15 mins", difficulty: "Easy", ingredients: ["Tomato"], instructions: ["Boil."] }
        ];
        await this.cacheService.set(cacheKey, mock, CACHE_TTL.RECIPES);
        return mock;
      }
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const cleanJson = text.replace(/```json|```/g, '').trim();
      const recipes = JSON.parse(cleanJson);
      await this.cacheService.set(cacheKey, recipes, CACHE_TTL.RECIPES);
      return recipes;
    } catch (error) {
      this.logger.error('Failed to generate recipes', error);
      return [];
    }
  }

  async updateItem(userId: string, itemId: string, update: any) {
    const item = await this.pantryModel.findOneAndUpdate(
      { _id: itemId, userId },
      { $set: update, updatedAt: new Date() },
      { new: true }
    ).exec();
    
    if (item) {
      await Promise.all([
        this.cacheService.del(`stats:${userId}`),
        this.cacheService.delByPattern(`pantry:${userId}:*`),
      ]);
    }
    return item;
  }

  async deleteItem(userId: string, itemId: string) {
    const res = await this.pantryModel.deleteOne({ _id: itemId, userId }).exec();
    if (res.deletedCount > 0) {
      await Promise.all([
        this.cacheService.del(`stats:${userId}`),
        this.cacheService.delByPattern(`pantry:${userId}:*`),
      ]);
    }
    return res;
  }
}
