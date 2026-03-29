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

    return { scan, status: 'Background processing started' };
  }

  async getScan(id: string) {
    return this.scanModel.findById(id).exec();
  }

  async findAll(userId: string) {
    return this.scanModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }
}
