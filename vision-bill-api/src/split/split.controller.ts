import { Controller, Post, Body } from '@nestjs/common';
import { SplitService } from './split.service';

@Controller('split')
export class SplitController {
  constructor(private splitService: SplitService) {}

  @Post('calculate')
  async calculate(@Body() body: { total: number; participants: any[] }) {
    return this.splitService.calculateEqualSplit(body.total, body.participants);
  }

  @Post('itemized')
  async itemized(@Body() body: { items: any[]; participants: any[] }) {
    return this.splitService.calculateItemizedSplit(body.items, body.participants);
  }
}
