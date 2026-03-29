import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PantryItem, PantryItemDocument } from './schemas/pantry-item.schema';
import { Scan, ScanDocument } from '../scans/schemas/scan.schema';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

import { CacheService } from './cache.service';
import { UserService } from '../auth/user.service';
import { NotificationService } from '../auth/notification.service';

@Injectable()
export class PantryService {
  private readonly logger = new Logger(PantryService.name);

  private genAI: GoogleGenerativeAI;
  private model: any;

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

  async indexScannedItems(userId: string, items: any[]) {
    this.logger.log(`Indexing ${items.length} items for user ${userId}`);
    
    for (const item of items) {
      const existing = await this.pantryModel.findOne({ userId, cleanName: item.cleanName });

      if (existing) {
        // Update price history (deduplicate)
        const lastEntry = existing.priceHistory[existing.priceHistory.length - 1];
        const isSameDay = lastEntry && new Date(lastEntry.date).toDateString() === new Date().toDateString();
        
        if (!isSameDay || lastEntry.price !== item.price) {
          const prevPrice = existing.currentPrice;
          existing.lastPrice = prevPrice;
          existing.currentPrice = item.price;
          existing.priceHistory.push({ date: new Date(), price: item.price });

          // Push notification on >15% price spike
          if (prevPrice && item.price > prevPrice) {
            const pct = ((item.price - prevPrice) / prevPrice) * 100;
            if (pct > 15) {
              this.sendSpikeNotification(userId, item.cleanName, prevPrice, item.price, pct);
            }
          }
        }

        // Keep only last 10 records for visualization
        if (existing.priceHistory.length > 10) existing.priceHistory.shift();

        await existing.save();
      } else {
        // Create new item
        await this.pantryModel.create({
          userId,
          cleanName: item.cleanName,
          shorthand: item.shorthand,
          category: item.category,
          currentPrice: item.price,
          unit: item.unit,
          priceHistory: [{ date: new Date(), price: item.price }]
        });
      }
    }

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
    await this.cacheService.set(cacheKey, items, 3600); // 1hr cache
    return items;
  }

  async getStats(userId: string) {
    const cacheKey = `stats:${userId}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const [items, scans] = await Promise.all([
      this.pantryModel.find({ userId }).exec(),
      this.scanModel.find({ userId, status: 'completed' }).exec()
    ]);

    const totalSpent = scans.reduce((acc, s) => acc + (s.extractedTotal || 0), 0);
    
    // Aggregate by category
    const byCategory: { [key: string]: number } = {};
    scans.forEach(scan => {
      scan.items?.forEach(item => {
        const category = item.category || 'Uncategorized';
        byCategory[category] = (byCategory[category] || 0) + (item.price || 0);
      });
    });

    // Calculate savings by comparing against previous highs
    let savings = 0;
    items.forEach(item => {
      if (item.priceHistory.length > 1) {
        const prices = item.priceHistory.map(h => Number(h.price));
        const maxPrice = Math.max(...prices);
        if (maxPrice > item.currentPrice) {
          savings += (maxPrice - item.currentPrice);
        }
      }
    });
    
    // Compute scan streak: consecutive days (ending today) with ≥1 completed scan
    const scanStreak = this.computeStreak(scans.map(s => (s as any).createdAt as Date));

    // Assign badges based on earned thresholds
    const badges: { emoji: string; label: string }[] = [];
    if (scanStreak >= 3) badges.push({ emoji: '🔥', label: `${scanStreak} Day Streak` });
    if (savings >= 200)  badges.push({ emoji: '🏆', label: 'Top Saver' });
    if (items.length >= 50) badges.push({ emoji: '🥦', label: 'Pantry Master' });
    if (scans.length >= 10) badges.push({ emoji: '📸', label: 'Scan Pro' });

    const stats = {
      totalSpent,
      savings,
      itemCount: items.length,
      byCategory,
      scanStreak,
      badges,
    };

    await this.cacheService.set(cacheKey, stats, 3600);
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
