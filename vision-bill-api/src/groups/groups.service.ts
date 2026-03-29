import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Group, GroupDocument } from './schemas/group.schema';

@Injectable()
export class GroupsService {
  constructor(@InjectModel(Group.name) private groupModel: Model<GroupDocument>) {}

  async create(userId: string, data: any) {
    return this.groupModel.create({ ...data, userId });
  }

  async findAll(userId: string) {
    return this.groupModel.find({ userId }).exec();
  }

  async update(id: string, userId: string, data: any) {
    return this.groupModel.findOneAndUpdate({ _id: id, userId }, data, { new: true }).exec();
  }

  async delete(id: string, userId: string) {
    return this.groupModel.findOneAndDelete({ _id: id, userId }).exec();
  }

  async addMember(id: string, userId: string, member: any) {
    return this.groupModel.findOneAndUpdate(
      { _id: id, userId },
      { $push: { members: member } },
      { new: true }
    ).exec();
  }

  async removeMember(groupId: string, userId: string, memberIndex: number) {
    const group = await this.groupModel.findOne({ _id: groupId, userId });
    if (group) {
      group.members.splice(memberIndex, 1);
      return group.save();
    }
  }
}
