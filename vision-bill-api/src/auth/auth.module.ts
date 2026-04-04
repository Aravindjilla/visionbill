import { Module } from '@nestjs/common';
import { AUTH_CONFIG } from '../common/constants';
import { MongooseModule } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User, UserSchema } from './schemas/user.schema';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

import { NotificationService } from './notification.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: 'Scan', schema: new MongooseSchema({}, { strict: false }) },
      { name: 'PantryItem', schema: new MongooseSchema({}, { strict: false }) },
      { name: 'Group', schema: new MongooseSchema({}, { strict: false }) },
    ]),
    PassportModule.register({ defaultStrategy: 'google' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: AUTH_CONFIG.REFRESH_TOKEN_EXPIRES }, // Default, though service overrides for refresh
      }),
    }),
  ],
  controllers: [AuthController, UserController],
  providers: [AuthService, UserService, NotificationService, GoogleStrategy, JwtStrategy],
  exports: [AuthService, UserService, NotificationService],
})
export class AuthModule {}
