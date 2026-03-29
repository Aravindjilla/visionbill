import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { PantryController } from './pantry.controller';
import { PantryService } from './pantry.service';
import { ExpiryProcessor } from './expiry.processor';
import { PantryItem, PantryItemSchema } from './schemas/pantry-item.schema';
import { Scan, ScanSchema } from '../scans/schemas/scan.schema';
import { CacheService } from './cache.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PantryItem.name, schema: PantryItemSchema },
      { name: Scan.name, schema: ScanSchema },
    ]),
    BullModule.registerQueue({ name: 'expiry-queue' }),
    AuthModule,
  ],
  controllers: [PantryController],
  providers: [PantryService, CacheService, ExpiryProcessor],
  exports: [PantryService, CacheService],
})
export class PantryModule {}
