import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto, UpdateProjectDto } from '@libs/shared-dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantGuard } from '../auth/tenant.guard';

@Controller('api/projects')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  async findAll(@Req() req: any) {
    const tenantId = req.user?.tenantId || req.tenantId;
    return this.projectService.findAll(tenantId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req.tenantId;
    return this.projectService.findOne(id, tenantId);
  }

  @Post()
  async create(@Body() dto: CreateProjectDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req.tenantId;
    return this.projectService.create(dto, tenantId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @Req() req: any
  ) {
    const tenantId = req.user?.tenantId || req.tenantId;
    return this.projectService.update(id, dto, tenantId);
  }
}
