import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async validateUser(details: any) {
    let user = await this.userModel.findOne({ email: details.email });
    if (!user) {
      user = await this.userModel.create(details);
    } else {
      user.displayName = details.displayName;
      user.avatar = details.avatar;
      await user.save();
    }
    
    const payload = { email: user.email, sub: user._id };
    return {
      user,
      accessToken: this.jwtService.sign(payload),
    };
  }
}
