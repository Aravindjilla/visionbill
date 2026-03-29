import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ScanSessionDocument = ScanSession & Document;

@Schema({ timestamps: true })
export class ScanSession {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ type: [String], default: [] })
  segmentPaths: string[];

  @Prop({ default: false })
  isFinalized: boolean;

  @Prop()
  billType?: string;

  @Prop({ default: Date.now, expires: '24h' })
  createdAt: Date;
}

export const ScanSessionSchema = SchemaFactory.createForClass(ScanSession);
