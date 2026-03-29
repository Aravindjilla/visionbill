import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BillItem, BillItemSchema } from './bill-item.schema';

export type ScanDocument = Scan & Document;

export enum ScanStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELETED = 'deleted',
}

export enum BillType {
  GROCERY = 'grocery',
  RESTAURANT = 'restaurant',
}

@Schema({ timestamps: true, indexes: [{ userId: 1, status: 1, createdAt: -1 }] })
export class Scan {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId: string;

  @Prop({ required: true })
  imageUrl: string;

  @Prop()
  rawText?: string;

  @Prop()
  merchantName?: string;

  @Prop()
  merchantAddress?: string;

  @Prop({ type: [BillItemSchema], default: [] })
  items: BillItem[];

  @Prop()
  extractedTotal?: number;

  @Prop()
  taxTotal?: number;

  @Prop()
  cgst?: number;

  @Prop()
  sgst?: number;

  @Prop({ enum: ScanStatus, default: ScanStatus.PENDING })
  status: ScanStatus;

  @Prop({ enum: BillType, default: BillType.GROCERY })
  billType: BillType;
}

export const ScanSchema = SchemaFactory.createForClass(Scan);
