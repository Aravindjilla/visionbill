import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { REDIS_CONFIG } from './common/constants';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 10,  // tighter for OCR/AI costs
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
