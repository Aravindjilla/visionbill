import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Controller('health')
export class HealthController {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectQueue('scan-queue') private readonly scanQueue: Queue,
  ) {}

  @Get()
  async check() {
    const mongoStatus = this.connection.readyState === 1 ? 'up' : 'down';
    
    let redisStatus = 'down';
    try {
      const client = await this.scanQueue.client;
      const ping = await client.ping();
      if (ping === 'PONG') redisStatus = 'up';
    } catch (e) {
      redisStatus = 'down';
    }

    return {
      status: mongoStatus === 'up' && redisStatus === 'up' ? 'ok' : 'error',
      details: {
        mongodb: mongoStatus,
        redis: redisStatus,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
