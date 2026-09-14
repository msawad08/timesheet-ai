import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TimeEntryService } from './time-entry.service';
import { CreateTimeEntryDto, UpdateTimeEntryDto } from '@libs/shared-dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantGuard } from '../auth/tenant.guard';

@Controller('api/time-entries')
@UseGuards(JwtAuthGuard, TenantGuard)
export class TimeEntryController {
  constructor(private readonly timeEntryService: TimeEntryService) {}

  @Get()
  async findAll(@Req() req: any) {
    const userId = req.user.id;
    const tenantId = req.user.tenantId;
    return this.timeEntryService.findAllForUser(userId, tenantId);
  }

  @Post()
  async create(@Body() dto: CreateTimeEntryDto, @Req() req: any) {
    const userId = req.user.id;
    const tenantId = req.user.tenantId;
    return this.timeEntryService.create(dto, userId, tenantId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTimeEntryDto,
    @Req() req: any
  ) {
    const userId = req.user.id;
    const tenantId = req.user.tenantId;
    return this.timeEntryService.update(id, dto, userId, tenantId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    const tenantId = req.user.tenantId;
    return this.timeEntryService.delete(id, userId, tenantId);
  }
}
