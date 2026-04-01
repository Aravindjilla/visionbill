import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel('Scan') private scanModel: Model<any>,
    @InjectModel('PantryItem') private pantryModel: Model<any>,
    @InjectModel('Group') private groupModel: Model<any>,
  ) {}

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findManyWithPushTokens(ids: string[]): Promise<UserDocument[]> {
    return this.userModel
      .find({ _id: { $in: ids }, pushToken: { $exists: true, $ne: '' } })
      .select('_id pushToken')
      .exec();
  }

  async updateProfile(id: string, update: { mobile?: string; upiId?: string; savingsGoal?: number }): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(id, { $set: update }, { new: true }).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async registerPushToken(id: string, pushToken: string): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(id, { $set: { pushToken } }, { new: true }).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async deleteAccount(id: string): Promise<UserDocument> {
    // Full Cascading Delete for DPDP / GDPR Compliance
    // Runs in parallel for maximum performance
    await Promise.all([
      this.scanModel.deleteMany({ userId: id }).exec(),
      this.pantryModel.deleteMany({ userId: id }).exec(),
      this.groupModel.deleteMany({ ownerId: id }).exec(),
    ]);
    
    const user = await this.userModel.findByIdAndDelete(id).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
