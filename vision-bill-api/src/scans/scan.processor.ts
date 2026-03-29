import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Scan, ScanDocument, ScanStatus } from './schemas/scan.schema';
import { OcrService } from './services/ocr.service';
import { NormalizerService } from './services/normalizer.service';
import { StrategyFactory } from './strategies/strategy.factory';
import { ReconcilerService } from './services/reconciler.service';
import { PantryService } from '../pantry/pantry.service';
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
    private notificationService: NotificationService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { scanId, userId } = job.data;
    this.logger.log(`Processing scan ${scanId} for user ${userId}`);

    const scan = await this.scanModel.findById(scanId);
    if (!scan) return;

    try {
      // 1. OCR (AI Vision)
      const rawText = await this.ocrService.processImage(scan.imageUrl);
      
      // 2. Normalize (Gemini 1.5 Flash)
      const normalizedData = await this.normalizerService.normalizeText(rawText);
      
      // 3. Strategy Normalization
      const strategy = this.strategyFactory.getStrategy(normalizedData.billType);
      const items = strategy.normalize(normalizedData.items);
      
      // 4. Reconcile
      const isReconciled = this.reconcilerService.reconcile(items, normalizedData.total);
      
      // 5. Final Update
      Object.assign(scan, {
        rawText: NormalizerService.scrubPII(rawText),
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
      
      await scan.save();
      
      // 6. Index to Pantry
      await this.pantryService.indexScannedItems(userId, items);

      // 7. Send Push Notification
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
      
      this.logger.log(`Successfully completed scan ${scanId}`);
      return { isReconciled };
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
