import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis/redis.service';

@Controller()
export class AppController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get(['health', 'api/health'])
  async getHealth() {
    let dbStatus = 'healthy';
    let redisStatus = 'healthy';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'offline';
    }

    try {
      const client = this.redis.getClient();
      if (client && client.status === 'ready') {
        redisStatus = 'healthy';
      } else {
        redisStatus = 'offline_or_deferred';
      }
    } catch {
      redisStatus = 'offline';
    }

    return {
      status: dbStatus === 'healthy' ? 'ok' : 'degraded',
      service: 'api-gateway',
      timestamp: new Date().toISOString(),
      dependencies: {
        database: dbStatus,
        redis: redisStatus,
      },
    };
  }
}
