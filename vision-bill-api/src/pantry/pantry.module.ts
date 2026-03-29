import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PantryController } from './pantry.controller';
import { PantryService } from './pantry.service';
import { PantryItem, PantryItemSchema } from './schemas/pantry-item.schema';
import { Scan, ScanSchema } from '../scans/schemas/scan.schema';

import { CacheService } from './cache.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PantryItem.name, schema: PantryItemSchema },
      { name: Scan.name, schema: ScanSchema },
    ]),
  ],
  controllers: [PantryController],
  providers: [PantryService, CacheService],
  exports: [PantryService, CacheService],
})
export class PantryModule {}
