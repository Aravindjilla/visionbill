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

@Injectable()
export class ScansService {
  constructor(
    @InjectModel(Scan.name) private scanModel: Model<ScanDocument>,
    @InjectModel(ScanSession.name) private sessionModel: Model<ScanSessionDocument>,
    private ocrService: OcrService,
    private normalizerService: NormalizerService,
    private strategyFactory: StrategyFactory,
    private reconcilerService: ReconcilerService,
    private stitchingService: StitchingService,
    private pantryService: PantryService,
    private storageService: StorageService,
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
    // 1. Image Stitching
    const stitchedPath = await this.stitchingService.stitchImages(files.map((f: any) => f.path || 'placeholder-url'));

    // 2. Upload to Cloud Storage
    const cloudUrl = await this.storageService.uploadImage(stitchedPath);

    // 3. Initial Scan Creation
    const scan = await this.scanModel.create({
      userId,
      imageUrl: cloudUrl,
      status: ScanStatus.PROCESSING,
    });

    try {
      // 2. OCR (Stubbed)
      const rawText = await this.ocrService.processImage(scan.imageUrl);
      
      // 3. Normalize (Stubbed)
      const normalizedData = await this.normalizerService.normalizeText(rawText);
      
      // 4. Strategy Normalization
      const strategy = this.strategyFactory.getStrategy(normalizedData.billType);
      const items = strategy.normalize(normalizedData.items);
      
      // 5. Reconcile
      const isReconciled = this.reconcilerService.reconcile(items, normalizedData.total);
      
      // 6. Final Update
      scan.rawText = rawText;
      scan.items = items;
      scan.extractedTotal = normalizedData.total;
      scan.billType = normalizedData.billType;
      scan.status = ScanStatus.COMPLETED;
      
      await scan.save();
      
      // Index to Pantry
      await this.pantryService.indexScannedItems(userId, items);
      
      return { scan, isReconciled };
    } catch (error) {
      scan.status = ScanStatus.FAILED;
      await scan.save();
      throw error;
    }
  }

  async getScan(id: string) {
    return this.scanModel.findById(id).exec();
  }

  async findAll(userId: string) {
    return this.scanModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }
}
