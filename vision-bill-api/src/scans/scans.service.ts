import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Scan, ScanDocument, ScanStatus } from './schemas/scan.schema';
import { OcrService } from './services/ocr.service';
import { NormalizerService } from './services/normalizer.service';
import { StrategyFactory } from './strategies/strategy.factory';
import { ReconcilerService } from './services/reconciler.service';
import { StitchingService } from './services/stitching.service';
import { StorageService } from './services/storage.service';

import { ScanSession, ScanSessionDocument } from './schemas/scan-session.schema';
import { PantryService } from '../pantry/pantry.service';

import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class ScansService {
  constructor(
    @InjectModel(Scan.name) private scanModel: Model<ScanDocument>,
    @InjectModel(ScanSession.name) private sessionModel: Model<ScanSessionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private ocrService: OcrService,
    private normalizerService: NormalizerService,
    private strategyFactory: StrategyFactory,
    private reconcilerService: ReconcilerService,
    private stitchingService: StitchingService,
    private pantryService: PantryService,
    private storageService: StorageService,
    @InjectQueue('scan-queue') private scanQueue: Queue,
  ) {}

  async createSession(userId: string) {
    return this.sessionModel.create({ userId });
  }

  async addSegmentToSession(sessionId: string, filePath: string) {
    return this.sessionModel.findByIdAndUpdate(
      sessionId,
      { $push: { segmentPaths: filePath } },
      { new: true }
    );
  }

  async finalizeSession(sessionId: string) {
    const session = await this.sessionModel.findById(sessionId);
    if (!session || session.isFinalized) throw new Error('Invalid session');
    
    const result = await this.createScan(session.userId, session.segmentPaths.map(p => ({ path: p })));
    session.isFinalized = true;
    await session.save();
    return result;
  }

  async createScan(userId: string, files: any[]) {
    // 0. Tier & Limit Check
    const user = await this.userModel.findById(userId);
    if (!user) throw new BadRequestException('User not found');
    
    if (user.tier === 'free' && (user.monthlyScanCount || 0) >= 5) {
      throw new BadRequestException('Monthly scan limit reached for Free tier. Please upgrade to Pro.');
    }

    // 1. Image Stitching
    const stitchedPath = await this.stitchingService.stitchImages(files.map((f: any) => f.path || 'placeholder-url'));

    // 2. Upload to Cloud Storage
    const cloudUrl = await this.storageService.uploadImage(stitchedPath);

    // 3. Initial Scan Creation (Status: PROCESSING)
    const scan = await this.scanModel.create({
      userId,
      imageUrl: cloudUrl,
      status: ScanStatus.PROCESSING,
    });

    // 4. Offload to Background Queue
    await this.scanQueue.add('process-scan', {
      scanId: scan._id,
      userId,
    });

    // 5. Increment usage
    await this.userModel.findByIdAndUpdate(userId, { $inc: { monthlyScanCount: 1 } });

    return { scan, status: 'Background processing started' };
  }

  async findById(id: string) {
    return this.scanModel.findById(id).exec();
  }

  async remove(id: string) {
    return this.scanModel.findByIdAndUpdate(id, { status: ScanStatus.DELETED }).exec();
  }

  async restore(id: string) {
    return this.scanModel.findByIdAndUpdate(id, { status: ScanStatus.COMPLETED }).exec();
  }

  async findAll(userId: string, limit?: number, page = 1) {
    const query = this.scanModel.find({ userId, status: { $ne: ScanStatus.DELETED } }).sort({ createdAt: -1 });
    if (limit) {
      query.skip((page - 1) * limit).limit(limit);
    }
    return query.exec();
  }

  async updateItems(id: string, items: any[]) {
    const total = items.reduce((acc, item) => acc + (item.price || 0), 0);
    return this.scanModel
      .findByIdAndUpdate(
        id,
        { $set: { items, extractedTotal: parseFloat(total.toFixed(2)) } },
        { new: true },
      )
      .exec();
  }

  async demoSeed(userId: string) {
    const demoItems = [
      { shorthand: 'ORG_TMT_1KG', cleanName: 'Organic Tomatoes', qty: 1, price: 150.00, category: 'Veggies', unit: '1kg' },
      { shorthand: 'MILK_FT_1L', cleanName: 'Fresh Whole Milk', qty: 1, price: 65.00, category: 'Dairy', unit: '1l' },
      { shorthand: 'SDR_BREAD', cleanName: 'Artisan Sourdough', qty: 1, price: 210.00, category: 'Bakery', unit: '500g' },
    ];

    const scan = await this.scanModel.create({
      userId,
      storeName: 'VisionBazaar Demo Store',
      merchantName: 'VisionBazaar Private Limited',
      merchantAddress: '123 Tech Park, Bengaluru, KA',
      billType: 'grocery',
      items: demoItems,
      extractedTotal: 425.00,
      taxTotal: 18.00,
      cgst: 9.00,
      sgst: 9.00,
      status: ScanStatus.COMPLETED,
      imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400',
    });

    await this.pantryService.indexScannedItems(userId, demoItems);
    return scan;
  }
}
