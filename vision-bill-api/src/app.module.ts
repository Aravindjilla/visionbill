import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { HealthController } from './health.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ScansModule } from './scans/scans.module';
import { SplitModule } from './split/split.module';
import { GroupsModule } from './groups/groups.module';
import { PantryModule } from './pantry/pantry.module';

import { BullModule } from '@nestjs/bullmq';
import { REDIS_CONFIG, THROTTLER_CONFIG } from './common/constants';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        JWT_SECRET:     Joi.string().required(),
        MONGODB_URI:    Joi.string().required(),
        REDIS_URL:      Joi.string().required(),
        GEMINI_API_KEY: Joi.string().required(),
        CLOUDINARY_URL: Joi.string().required(),
        PORT:           Joi.number().default(3000),
        NODE_ENV:       Joi.string().valid('development', 'production', 'test').default('development'),
      }),
    }),
    ThrottlerModule.forRoot([{
      ttl: THROTTLER_CONFIG.TTL_MS,
      limit: THROTTLER_CONFIG.LIMIT,
    }]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.get<string>('REDIS_URL') || REDIS_CONFIG.DEFAULT_URL,
        },
      }),
    }),
    BullModule.registerQueue({
      name: 'scan-queue',
    }),
    AuthModule,
    ScansModule,
    SplitModule,
    GroupsModule,
    PantryModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 10,
        socketTimeoutMS: 45000,
        autoIndex: configService.get('NODE_ENV') !== 'production',
      }),
    }),
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
