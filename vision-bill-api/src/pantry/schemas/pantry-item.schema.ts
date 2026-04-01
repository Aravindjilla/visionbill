import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PantryItemDocument = PantryItem & Document;

@Schema({ timestamps: true })
export class PantryItem {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId: string;

  @Prop({ required: true })
  cleanName: string;

  @Prop()
  shorthand: string;

  @Prop()
  category: string;

  @Prop({ required: true })
  currentPrice: number;

  @Prop()
  lastPrice?: number;

  @Prop({ type: [{ date: Date, price: Number }], default: [] })
  priceHistory: { date: Date; price: Number }[];

  @Prop()
  unit?: string;

  @Prop({ index: true })
  expiresAt?: Date;
}

export const PantryItemSchema = SchemaFactory.createForClass(PantryItem);
PantryItemSchema.index({ userId: 1, cleanName: 1 }, { unique: true });
PantryItemSchema.index({ userId: 1, updatedAt: -1 });
