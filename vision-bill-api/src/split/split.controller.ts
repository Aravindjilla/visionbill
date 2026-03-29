import { Controller, Post, Get, Body, Query, Request } from '@nestjs/common';
import { SplitService } from './split.service';
import { SettlementService, ParticipantEntry } from './settlement.service';

@Controller('split')
export class SplitController {
  constructor(
    private splitService: SplitService,
    private settlementService: SettlementService,
  ) {}

  @Post('calculate')
  async calculate(@Body() body: { total: number; participants: any[] }) {
    return this.splitService.calculateEqualSplit(body.total, body.participants);
  }

  @Post('itemized')
  async itemized(@Body() body: { items: any[]; participants: any[] }) {
    return this.splitService.calculateItemizedSplit(body.items, body.participants);
  }

  // --- Settlement Ledger ---

  @Post('settlement/record')
  async recordExpense(
    @Request() req: any,
    @Body() body: {
      participants: ParticipantEntry[];
      description: string;
      scanId?: string;
    },
  ) {
    const userId = req.user?.userId || 'demo-user-id';
    return this.settlementService.recordExpense(
      userId,
      body.participants,
      body.description,
      body.scanId,
    );
  }

  @Get('settlement/balances')
  async getBalances(@Request() req: any) {
    const userId = req.user?.userId || 'demo-user-id';
    return this.settlementService.getBalances(userId);
  }

  @Post('settlement/settle')
  async settle(
    @Request() req: any,
    @Body() body: { counterpartyMobile: string; amount: number },
  ) {
    const userId = req.user?.userId || 'demo-user-id';
    return this.settlementService.settle(userId, body.counterpartyMobile, body.amount);
  }

  @Get('settlement/history')
  async getHistory(
    @Request() req: any,
    @Query('mobile') mobile: string,
  ) {
    const userId = req.user?.userId || 'demo-user-id';
    return this.settlementService.getHistory(userId, mobile);
  }
}
