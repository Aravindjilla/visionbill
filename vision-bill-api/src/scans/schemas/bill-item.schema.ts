import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class BillItem {
  @Prop({ required: true })
  shorthand: string;

  @Prop({ required: true })
  cleanName: string;

  @Prop()
  category: string;

  @Prop({ default: 1 })
  qty: number;

  @Prop()
  unit: string;

  @Prop({ required: true })
  price: number;

  @Prop()
  imageUrl?: string;

  @Prop({ type: [{ participantId: String, share: Number }], default: [] })
  assignedParticipants: { participantId: string; share: number }[];

  @Prop({ default: false })
  isSplit: boolean;
}

export const BillItemSchema = SchemaFactory.createForClass(BillItem);
