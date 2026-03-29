import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type GroupDocument = Group & Document;

@Schema({ timestamps: true })
export class Member {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  mobile: string;

  @Prop()
  upiId?: string;
}

const MemberSchema = SchemaFactory.createForClass(Member);

@Schema({ timestamps: true })
export class Group {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: [MemberSchema], default: [] })
  members: Member[];
}

export const GroupSchema = SchemaFactory.createForClass(Group);
