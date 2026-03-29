import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScansController } from './scans.controller';
import { ScansService } from './scans.service';
import { Scan, ScanSchema } from './schemas/scan.schema';
import { BillItem, BillItemSchema } from './schemas/bill-item.schema';
import { ScanSession, ScanSessionSchema } from './schemas/scan-session.schema';
import { User, UserSchema } from '../auth/schemas/user.schema';

import { OcrService } from './services/ocr.service';
import { NormalizerService } from './services/normalizer.service';
import { ReconcilerService } from './services/reconciler.service';
import { StitchingService } from './services/stitching.service';
import { StrategyFactory } from './strategies/strategy.factory';
import { StorageService } from './services/storage.service';
import { ScanProcessor } from './scan.processor';

import { PantryModule } from '../pantry/pantry.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Scan.name, schema: ScanSchema },
      { name: BillItem.name, schema: BillItemSchema },
      { name: ScanSession.name, schema: ScanSessionSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuthModule,
    PantryModule,
    ConfigModule,
    BullModule.registerQueue({
      name: 'scan-queue',
    }),
  ],
  controllers: [ScansController],
  providers: [
    ScansService,
    OcrService,
    NormalizerService,
    ReconcilerService,
    StitchingService,
    StrategyFactory,
    StorageService,
    ScanProcessor,
  ],
  exports: [ScansService],
})
export class ScansModule {}
