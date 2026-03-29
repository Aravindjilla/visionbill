import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs';
import axios from 'axios';
import { Scan, ScanDocument, ScanStatus } from './schemas/scan.schema';
import { OcrService } from './services/ocr.service';
import { NormalizerService } from './services/normalizer.service';
import { StrategyFactory } from './strategies/strategy.factory';
import { ReconcilerService } from './services/reconciler.service';
import { PantryService } from '../pantry/pantry.service';
import { StorageService } from './services/storage.service';
import { NotificationService } from '../auth/notification.service';
import { UserService } from '../auth/user.service';
import { Logger } from '@nestjs/common';

@Processor('scan-queue')
export class ScanProcessor extends WorkerHost {
  private readonly logger = new Logger(ScanProcessor.name);

  constructor(
    @InjectModel(Scan.name) private scanModel: Model<ScanDocument>,
    private ocrService: OcrService,
    private normalizerService: NormalizerService,
    private strategyFactory: StrategyFactory,
    private reconcilerService: ReconcilerService,
    private pantryService: PantryService,
    private userService: UserService,
    private storageService: StorageService,
    private notificationService: NotificationService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { scanId, userId, localStitchedPath } = job.data;
    this.logger.log(`Processing scan ${scanId} for user ${userId} (Local: ${!!localStitchedPath})`);

    const scan = await this.scanModel.findById(scanId);
    if (!scan) return;

    try {
      let normalizedData;
      let rawTextForStorage = '';

      if (localStitchedPath && fs.existsSync(localStitchedPath)) {
        // Rec 1 & 6: Read from disk and use multimodal single-call
        const imageBuffer = await fs.promises.readFile(localStitchedPath);
        normalizedData = await this.normalizerService.normalizeImage(imageBuffer);
        rawTextForStorage = normalizedData.rawText || '';
      } else {
        // Fallback to legacy Cloudinary flow if local path missing
        this.logger.warn(`Local path missing for scan ${scanId}, falling back to legacy image-url processing`);
        const response = await axios.get(scan.imageUrl, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(response.data);
        normalizedData = await this.normalizerService.normalizeImage(imageBuffer);
        rawTextForStorage = normalizedData.rawText || '';
      }
      
      // Strategy Normalization
      const strategy = this.strategyFactory.getStrategy(normalizedData.billType);
      const items = strategy.normalize(normalizedData.items);
      
      // Update DB with extracted data
      Object.assign(scan, {
        rawText: NormalizerService.scrubPII(rawTextForStorage),
        items,
        extractedTotal: normalizedData.total,
        billType: normalizedData.billType,
        merchantName: normalizedData.merchantName,
        merchantAddress: normalizedData.merchantAddress,
        taxTotal: normalizedData.taxTotal,
        cgst: normalizedData.cgst,
        sgst: normalizedData.sgst,
        status: ScanStatus.COMPLETED,
      });

      // Rec 1: Upload to Cloudinary AFTER successful AI processing
      if (localStitchedPath && fs.existsSync(localStitchedPath)) {
        const cloudUrl = await this.storageService.uploadImage(localStitchedPath);
        scan.imageUrl = cloudUrl;
      }
      
      await scan.save();
      
      // Index to Pantry
      await this.pantryService.indexScannedItems(userId, items);

      // Send Push Notification
      try {
        const user = await this.userService.findById(userId);
        if (user?.pushToken) {
          await this.notificationService.sendNotification(
            user.pushToken,
            'Scan Complete! 🧾',
            `Processed ${items.length} items. Tap to verify and split.`,
            { scanId }
          );
        }
      } catch (error) {
        this.logger.error(`Failed to send push notification: ${error.message}`);
      }
      
      return { isReconciled: true };
    } catch (error) {
      this.logger.error(`Failed to process scan ${scanId}: ${error.message}`);
      scan.status = ScanStatus.FAILED;
      await scan.save();
      throw error;
    }
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`Job ${job.id} became active`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);
    const { scanId } = job.data;
    if (scanId) {
      this.logger.warn(`Marking scan ${scanId} as FAILED in database via onFailed handler`);
      await this.scanModel.findByIdAndUpdate(scanId, { status: ScanStatus.FAILED });
    }
  }
}
