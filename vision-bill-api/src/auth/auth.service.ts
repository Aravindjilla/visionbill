import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

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
      user.lastLogin = new Date();
    }
    
    return this.generateTokens(user);
  }

  async generateTokens(user: UserDocument) {
    const payload = { email: user.email, sub: user._id };
    
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    
    user.currentRefreshToken = await bcrypt.hash(refreshToken, 10);
    await user.save();
    
    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
      }
    };
  }

  async refresh(userId: string, incomingToken: string) {
    const user = await this.userModel.findById(userId);
    const isMatch = user && user.currentRefreshToken ? await bcrypt.compare(incomingToken, user.currentRefreshToken) : false;
    if (!isMatch) {
      throw new Error('Invalid refresh token');
    }
    return this.generateTokens(user);
  }
}
