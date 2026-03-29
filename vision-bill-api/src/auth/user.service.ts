import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(id: string, update: { mobile?: string; upiId?: string }): Promise<UserDocument> {
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
    const user = await this.userModel.findByIdAndDelete(id).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
