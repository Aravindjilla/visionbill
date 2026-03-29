import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  googleId: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  displayName: string;

  @Prop()
  avatar: string;

  @Prop()
  mobile?: string;

  @Prop()
  upiId?: string;

  @Prop()
  pushToken?: string;

  @Prop({ default: 500 })
  savingsGoal?: number;

  @Prop({ default: 'free' })
  tier?: string;

  @Prop({ default: 0 })
  monthlyScanCount?: number;

  @Prop({ default: '' })
  lastResetMonth?: string;

  @Prop()
  lastLogin?: Date;

  @Prop()
  currentRefreshToken?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
