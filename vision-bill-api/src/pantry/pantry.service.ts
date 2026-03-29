import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PantryItem, PantryItemDocument } from './schemas/pantry-item.schema';
import { Scan, ScanDocument } from '../scans/schemas/scan.schema';

import { CacheService } from './cache.service';

@Injectable()
export class PantryService {
  private readonly logger = new Logger(PantryService.name);

  constructor(
    @InjectModel(PantryItem.name) private pantryModel: Model<PantryItemDocument>,
    @InjectModel(Scan.name) private scanModel: Model<ScanDocument>,
    private cacheService: CacheService,
  ) {}

  async indexScannedItems(userId: string, items: any[]) {
    this.logger.log(`Indexing ${items.length} items for user ${userId}`);
    
    for (const item of items) {
      const existing = await this.pantryModel.findOne({ userId, cleanName: item.cleanName });

      if (existing) {
        // Update price history
        existing.lastPrice = existing.currentPrice;
        existing.currentPrice = item.price;
        existing.priceHistory.push({ date: new Date(), price: item.price });
        
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
    
    const stats = {
      totalSpent, 
      savings,
      itemCount: items.length,
      byCategory,
    };

    await this.cacheService.set(cacheKey, stats, 3600);
    return stats;
  }
}
