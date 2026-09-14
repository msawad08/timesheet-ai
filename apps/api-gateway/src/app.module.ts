import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { ProjectModule } from './project/project.module';
import { TimeEntryModule } from './time-entry/time-entry.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    AuthModule,
    ProjectModule,
    TimeEntryModule,
  ],
})
export class AppModule {}
