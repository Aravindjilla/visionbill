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
import { SCAN_LIMITS, CACHE_TTL } from '../common/constants';

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
            this.sendSpikeNotification(userId, item.cleanName, existing.currentPrice, item.price, pct);
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

    // Invalidate cache
    await Promise.all([
      this.cacheService.del(`stats:${userId}`),
      this.cacheService.del(`pantry:${userId}`),
    ]);
  }

  async getPantryItems(userId: string) {
    const cacheKey = `pantry:${userId}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const items = await this.pantryModel.find({ userId }).sort({ updatedAt: -1 }).exec();
    await this.cacheService.set(cacheKey, items, CACHE_TTL.PANTRY);
    return items;
  }

  async getStats(userId: string) {
    const cacheKey = `stats:${userId}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    // Use aggregation for volume/heavy data
    const [scanStats, savingsData, itemsCount] = await Promise.all([
      this.scanModel.aggregate([
        { $match: { userId, status: 'completed' } },
        { $unwind: '$items' },
        {
          $group: {
            _id: null,
            totalSpent: { $sum: '$extractedTotal' },
            byCategory: {
              $push: { k: '$items.category', v: '$items.price' }
            }
          }
        }
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
    const totalSpent = scanStats[0]?.totalSpent || 0;
    const savings = savingsData[0]?.totalSavings || 0;
    const byCategory: { [key: string]: number } = {};
    
    // Process category counts from aggregation if needed or just use a second group stage
    // For now I'll use the results we have
    
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
      byCategory, // Category aggregation could be refined further
      scanStreak,
      badges,
    };

    await this.cacheService.set(cacheKey, stats, CACHE_TTL.STATS);
    return stats;
  }

  private async sendSpikeNotification(
    userId: string,
    itemName: string,
    prevPrice: number,
    newPrice: number,
    pct: number,
  ) {
    try {
      const user = await this.userService.findById(userId);
      if (user?.pushToken) {
        await this.notificationService.sendNotification(
          user.pushToken,
          '🚨 Price Hike Alert',
          `${itemName} went up +${pct.toFixed(0)}% (₹${prevPrice} → ₹${newPrice})`,
          { type: 'price_spike', itemName, prevPrice, newPrice },
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

    const scans = await this.scanModel.find({
      userId,
      status: 'completed',
      createdAt: { $gte: sevenDaysAgo },
    }).exec();

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result: { day: string; total: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const dateStr = d.toDateString();

      const dayTotal = scans
        .filter(s => new Date((s as any).createdAt).toDateString() === dateStr)
        .reduce((acc, s) => acc + (s.extractedTotal || 0), 0);

      result.push({ day: dayLabels[d.getDay()], total: dayTotal });
    }

    return result;
  }

  async suggestRecipes(userId: string) {
    const items = await this.pantryModel.find({ userId }).exec();
    if (items.length === 0) return [];

    const itemNames = items.map(i => i.cleanName).join(', ');

    const prompt = `
      You are a world-class chef. I have the following ingredients in my digital pantry based on receipts I scanned recently:
      [${itemNames}]

      Please suggest 3 different, creative recipes I can make using primarily these ingredients. You can assume I have basic pantry staples like oil, salt, and pepper.
      
      Return ONLY a pure JSON array containing 3 objects with the following exact structure:
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
         return [
           { title: "Mock Tomato Soup", time: "15 mins", difficulty: "Easy", ingredients: ["Tomato"], instructions: ["Boil."] }
         ];
      }
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const cleanJson = text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      this.logger.error('Failed to generate recipes', error);
      return [];
    }
  }
}
