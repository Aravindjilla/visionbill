import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LedgerEntry, LedgerEntryDocument } from './schemas/ledger-entry.schema';

export interface ParticipantEntry {
  name: string;
  mobile: string;
  amount: number; // how much they owe the payer (positive)
}

export interface BalanceSummary {
  counterpartyName: string;
  counterpartyMobile: string;
  /** positive = they owe me; negative = I owe them */
  netAmount: number;
  transactionCount: number;
}

@Injectable()
export class SettlementService {
  constructor(
    @InjectModel(LedgerEntry.name) private ledgerModel: Model<LedgerEntryDocument>,
  ) {}

  /**
   * Record that the current user paid a bill for a set of participants.
   * Creates one ledger entry per participant (they owe the user their share).
   */
  async recordExpense(
    userId: string,
    participants: ParticipantEntry[],
    description: string,
    scanId?: string,
  ): Promise<LedgerEntry[]> {
    const entries = participants.map((p) => ({
      userId,
      counterpartyName: p.name,
      counterpartyMobile: p.mobile,
      amount: p.amount,
      description,
      scanId,
      isSettled: false,
    }));
    return this.ledgerModel.insertMany(entries);
  }

  /**
   * Returns the net balance for each unique counterparty.
   * Aggregates all unsettled entries grouped by counterpartyMobile.
   */
  async getBalances(userId: string): Promise<BalanceSummary[]> {
    const entries = await this.ledgerModel
      .find({ userId, isSettled: false })
      .exec();

    const map = new Map<string, BalanceSummary>();

    for (const entry of entries) {
      const key = entry.counterpartyMobile;
      if (!map.has(key)) {
        map.set(key, {
          counterpartyName: entry.counterpartyName,
          counterpartyMobile: entry.counterpartyMobile,
          netAmount: 0,
          transactionCount: 0,
        });
      }
      const summary = map.get(key)!;
      summary.netAmount = parseFloat((summary.netAmount + entry.amount).toFixed(2));
      summary.transactionCount++;
    }

    return Array.from(map.values()).filter((b) => Math.abs(b.netAmount) >= 0.01);
  }

  /**
   * Record a settlement payment. Marks matching entries as settled
   * (from most recent backwards) until the settled amount is consumed.
   */
  async settle(
    userId: string,
    counterpartyMobile: string,
    amount: number,
  ): Promise<{ settled: number; remaining: number }> {
    if (amount <= 0) throw new BadRequestException('Settlement amount must be positive');

    const entries = await this.ledgerModel
      .find({ userId, counterpartyMobile, isSettled: false, amount: { $gt: 0 } })
      .sort({ createdAt: 1 })
      .exec();

    let remaining = amount;
    let settled = 0;

    for (const entry of entries) {
      if (remaining <= 0) break;
      if (entry.amount <= remaining) {
        entry.isSettled = true;
        entry.settledAt = new Date();
        remaining = parseFloat((remaining - entry.amount).toFixed(2));
        settled = parseFloat((settled + entry.amount).toFixed(2));
      } else {
        // Partial settlement — split the entry
        const settledPart = remaining;
        entry.amount = parseFloat((entry.amount - settledPart).toFixed(2));
        settled = parseFloat((settled + settledPart).toFixed(2));
        remaining = 0;
        await this.ledgerModel.create({
          userId,
          counterpartyName: entry.counterpartyName,
          counterpartyMobile,
          amount: settledPart,
          description: `Partial settlement`,
          isSettled: true,
          settledAt: new Date(),
        });
      }
      await entry.save();
    }

    return { settled, remaining };
  }

  /**
   * Full transaction history for a counterparty (settled + unsettled).
   */
  async getHistory(userId: string, counterpartyMobile: string): Promise<LedgerEntry[]> {
    return this.ledgerModel
      .find({ userId, counterpartyMobile })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }
}
