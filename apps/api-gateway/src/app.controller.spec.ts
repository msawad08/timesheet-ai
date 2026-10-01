import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis/redis.service';

describe('AppController Health Checks', () => {
  let controller: AppController;
  let prisma: { $queryRaw: jest.Mock };
  let redis: { getClient: jest.Mock };

  beforeEach(async () => {
    prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
    };

    redis = {
      getClient: jest.fn().mockReturnValue({ status: 'ready' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  it('should return status ok when database and redis are healthy', async () => {
    const health = await controller.getHealth();
    expect(health.status).toBe('ok');
    expect(health.service).toBe('api-gateway');
    expect(health.dependencies.database).toBe('healthy');
    expect(health.dependencies.redis).toBe('healthy');
  });

  it('should return status degraded if database query fails', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('DB offline'));

    const health = await controller.getHealth();
    expect(health.status).toBe('degraded');
    expect(health.dependencies.database).toBe('offline');
  });
});
