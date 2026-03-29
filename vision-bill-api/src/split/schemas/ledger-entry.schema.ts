import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type LedgerEntryDocument = LedgerEntry & Document;

/**
 * A single ledger entry representing that `debtorMobile` owes `amount` to
 * the authenticated user (userId). Negative amount means the user owes them.
 */
@Schema({ timestamps: true })
export class LedgerEntry {
  /** The user who paid / owns this record */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId: string;

  /** Counterparty display name */
  @Prop({ required: true })
  counterpartyName: string;

  /** Counterparty mobile — used as the stable identifier for aggregation */
  @Prop({ required: true })
  counterpartyMobile: string;

  /**
   * Positive  → counterparty owes this user (user paid for them).
   * Negative  → this user owes counterparty (they paid for the user).
   */
  @Prop({ required: true })
  amount: number;

  @Prop({ default: '' })
  description: string;

  @Prop()
  scanId?: string;

  @Prop({ default: false })
  isSettled: boolean;

  @Prop()
  settledAt?: Date;
}

export const LedgerEntrySchema = SchemaFactory.createForClass(LedgerEntry);
LedgerEntrySchema.index({ userId: 1, counterpartyMobile: 1, isSettled: 1 });
