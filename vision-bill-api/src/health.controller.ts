import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
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

  /**
   * Liveness probe: Process is running
   */
  @Get('live')
  async live() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  /**
   * Readiness probe: Dependencies are up
   */
  @Get('ready')
  async ready() {
    const mongoStatus = this.connection.readyState === 1 ? 'up' : 'down';
    
    let redisStatus = 'down';
    try {
      const client = await this.scanQueue.client;
      const ping = await client.ping();
      if (ping === 'PONG') redisStatus = 'up';
    } catch (e) {
      redisStatus = 'down';
    }

    const isHealthy = mongoStatus === 'up' && redisStatus === 'up';

    const result = {
      status: isHealthy ? 'ok' : 'error',
      details: {
        mongodb: mongoStatus,
        redis: redisStatus,
      },
      timestamp: new Date().toISOString(),
    };

    if (!isHealthy) {
      throw new ServiceUnavailableException(result);
    }
    return result;
  }

  @Get()
  async check() {
    return this.ready();
  }
}
