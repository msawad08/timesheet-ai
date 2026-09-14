import { Module } from '@nestjs/common';
import { TimeEntryService } from './time-entry.service';
import { TimeEntryController } from './time-entry.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [TimeEntryController],
  providers: [TimeEntryService],
  exports: [TimeEntryService],
})
export class TimeEntryModule {}
