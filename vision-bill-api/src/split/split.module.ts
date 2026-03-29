import { Module } from '@nestjs/common';
import { SplitController } from './split.controller';
import { SplitService } from './split.service';
import { WhatsappService } from './services/whatsapp.service';

@Module({
  controllers: [SplitController],
  providers: [SplitService, WhatsappService],
  exports: [SplitService],
})
export class SplitModule {}
