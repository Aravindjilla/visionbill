import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SplitController } from './split.controller';
import { SplitService } from './split.service';
import { SettlementService } from './settlement.service';
import { LedgerEntry, LedgerEntrySchema } from './schemas/ledger-entry.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LedgerEntry.name, schema: LedgerEntrySchema },
    ]),
  ],
  controllers: [SplitController],
  providers: [SplitService, SettlementService],
  exports: [SplitService, SettlementService],
})
export class SplitModule {}
