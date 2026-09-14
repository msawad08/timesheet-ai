import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from '@libs/shared-dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantGuard } from '../auth/tenant.guard';

@Controller('api/projects')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  async findAll(@Req() req: any) {
    const tenantId = req.user.tenantId;
    return this.projectService.findAll(tenantId);
  }

  @Post()
  async create(@Body() dto: CreateProjectDto, @Req() req: any) {
    const tenantId = req.user.tenantId;
    return this.projectService.create(dto, tenantId);
  }
}
