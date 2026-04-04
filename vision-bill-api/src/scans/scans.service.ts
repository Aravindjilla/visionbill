import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as path from 'path';
import * as fs from 'fs';
// @ts-ignore
import * as pdf from 'pdf-img-convert';

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

import { SCAN_LIMITS, PDF_CONFIG } from '../common/constants';
import { ScanResponseDto } from '../common-types';

@Injectable()
export class ScansService {
  private readonly logger = new Logger(ScansService.name);

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

  async createSession(userId: string): Promise<ScanSessionDocument> {
    return this.sessionModel.create({ userId });
  }

  async addSegmentToSession(sessionId: string, filePath: string, userId: string): Promise<ScanSessionDocument> {
    const session = await this.sessionModel.findById(sessionId);
    if (!session) throw new NotFoundException('Session not found');
    if (String(session.userId) !== userId) throw new ForbiddenException();
    return (await this.sessionModel.findByIdAndUpdate(
      sessionId,
      { $push: { segmentPaths: filePath } },
      { new: true }
    ))!;
  }

  async finalizeSession(sessionId: string, userId: string): Promise<ScanResponseDto> {
    const session = await this.sessionModel.findById(sessionId);
    if (!session) throw new NotFoundException('Session not found');
    if (String(session.userId) !== userId) throw new ForbiddenException();
    if (session.isFinalized) throw new BadRequestException('Session already finalized');
    
    const files = session.segmentPaths.map(p => ({ path: p } as Express.Multer.File));
    const result = await this.createScan(session.userId, files);
    session.isFinalized = true;
    await session.save();
    return result;
  }

  private async checkAndResetUsage(user: any): Promise<any> {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    if (user.lastResetMonth !== currentMonth) {
      user.monthlyScanCount = 0;
      user.lastResetMonth = currentMonth;
      return user.save();
    }
    return user;
  }

  /**
   * Internal helper to handle the heavy lifting of scan processing
   */
  private async _enqueueScan(userId: string, imagePaths: string[]): Promise<ScanDocument> {
    // 1. Image Stitching
    const stitchedPath = await this.stitchingService.stitchImages(imagePaths);

    // 2. Initial Scan Creation (Status: PROCESSING)
    // We store 'local://' temporarily or just null. Cloud URL will be updated by processor.
    const scan = await this.scanModel.create({
      userId,
      imageUrl: 'processing...', 
      status: ScanStatus.PROCESSING,
    });

    // 3. Offload to Background Queue
    // We pass the local path so the processor can read from disk (Rec 1)
    await this.scanQueue.add('process-scan', {
      scanId: scan._id,
      userId,
      localStitchedPath: stitchedPath, 
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: 100, // Keep last 100 successful jobs for debugging
      removeOnFail: 500,     // Keep last 500 failed jobs for debugging
    });

    // 4. Increment usage count
    await this.userModel.findByIdAndUpdate(userId, { $inc: { monthlyScanCount: 1 } });

    return scan;
  }

  async createScan(userId: string, files: Express.Multer.File[]): Promise<ScanResponseDto> {
    let user: any = await this.userModel.findById(userId);
    if (!user) throw new BadRequestException('User not found');
    
    user = await this.checkAndResetUsage(user!);

    if (user.tier === 'free' && (user.monthlyScanCount || 0) >= SCAN_LIMITS.FREE_TIER_MONTHLY_LIMIT) {
      throw new BadRequestException(`Monthly scan limit reached for Free tier (${SCAN_LIMITS.FREE_TIER_MONTHLY_LIMIT}). Please upgrade to Pro.`);
    }

    const scan = await this._enqueueScan(userId, files.map(f => f.path || 'placeholder'));
    return { scan, status: 'Processing started' };
  }

  async processPdfScan(userId: string, file: Express.Multer.File): Promise<ScanResponseDto> {
    let user: any = await this.userModel.findById(userId);
    if (!user) throw new BadRequestException('User not found');
    
    user = await this.checkAndResetUsage(user!);

    if (user.tier === 'free' && (user.monthlyScanCount || 0) >= SCAN_LIMITS.FREE_TIER_MONTHLY_LIMIT) {
      throw new BadRequestException(`Monthly scan limit reached for Free tier (${SCAN_LIMITS.FREE_TIER_MONTHLY_LIMIT}). Please upgrade to Pro.`);
    }

    const segmentPaths: string[] = [];
    try {
      // 1. Convert PDF to Images
      const pageImages = await pdf.convert(file.path, {
        width: PDF_CONFIG.PAGE_WIDTH,
        format: 'jpeg',
      });

      if (pageImages.length > PDF_CONFIG.MAX_PAGES) {
        throw new BadRequestException(`PDF exceeds the maximum of ${PDF_CONFIG.MAX_PAGES} pages.`);
      }

      const tempDir = path.join(process.cwd(), PDF_CONFIG.TEMP_DIR);
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      // Parallelize file writes instead of sequential loop
      const timestamp = Date.now();
      const writePaths = pageImages.map((_: any, i: number) =>
        path.join(tempDir, `pdf_${timestamp}_${i}.jpg`)
      );
      await Promise.all(
        pageImages.map((img: any, i: number) => fs.promises.writeFile(writePaths[i], img))
      );
      segmentPaths.push(...writePaths);

      const scan = await this._enqueueScan(userId, segmentPaths);
      return { scan, status: 'PDF processing started' };
    } catch (error) {
      this.logger.error(`PDF conversion failed for user ${userId}:`, error.stack);
      throw error;
    } finally {
      // Parallel cleanup of temp files
      await Promise.all(
        segmentPaths.map(p =>
          fs.promises.unlink(p).catch(err =>
            this.logger.error(`Failed to cleanup temp PDF page: ${p}`, err)
          )
        )
      );
    }
  }

  async findById(id: string, userId: string): Promise<ScanDocument> {
    const scan = await this.scanModel.findById(id).exec();
    if (!scan) throw new NotFoundException('Scan not found');
    if (String(scan.userId) !== userId) throw new ForbiddenException();
    return scan;
  }

  async remove(id: string, userId: string): Promise<ScanDocument> {
    const scan = await this.scanModel.findById(id).exec();
    if (!scan) throw new NotFoundException('Scan not found');
    if (String(scan.userId) !== userId) throw new ForbiddenException();
    return (await this.scanModel.findByIdAndUpdate(id, { status: ScanStatus.DELETED }, { new: true }))!;
  }

  async restore(id: string, userId: string): Promise<ScanDocument> {
    const scan = await this.scanModel.findById(id).exec();
    if (!scan) throw new NotFoundException('Scan not found');
    if (String(scan.userId) !== userId) throw new ForbiddenException();
    return (await this.scanModel.findByIdAndUpdate(id, { status: ScanStatus.COMPLETED }, { new: true }))!;
  }

  async findAll(userId: string, limit?: number, page = 1): Promise<ScanDocument[]> {
    const clampedLimit = limit ? Math.min(Math.max(limit, 1), 100) : undefined;
    const clampedPage = Math.max(page, 1);
    const query = this.scanModel.find({ userId, status: { $ne: ScanStatus.DELETED } }).sort({ createdAt: -1 });
    if (clampedLimit) {
      query.skip((clampedPage - 1) * clampedLimit).limit(clampedLimit);
    }
    return query.exec();
  }

  async updateItems(id: string, items: any[], userId: string): Promise<ScanDocument> {
    const scan = await this.scanModel.findById(id).exec();
    if (!scan) throw new NotFoundException('Scan not found');
    if (String(scan.userId) !== userId) throw new ForbiddenException();
    const total = items.reduce((acc, item) => acc + (item.price || 0), 0);
    return (await this.scanModel
      .findByIdAndUpdate(
        id,
        { $set: { items, extractedTotal: parseFloat(total.toFixed(2)) } },
        { new: true },
      ))!;
  }

  async demoSeed(userId: string): Promise<ScanDocument> {
    const demoItems = [
      { shorthand: 'ORG_TMT_1KG', cleanName: 'Organic Tomatoes', qty: 1, price: 150.00, category: 'Veggies', unit: '1kg' },
      { shorthand: 'MILK_FT_1L', cleanName: 'Fresh Whole Milk', qty: 1, price: 65.00, category: 'Dairy', unit: '1l' },
      { shorthand: 'SDR_BREAD', cleanName: 'Artisan Sourdough', qty: 1, price: 210.00, category: 'Bakery', unit: '500g' },
    ];

    const scan = await this.scanModel.create({
      userId,
      merchantName: 'VisionBazaar Demo Store',
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
