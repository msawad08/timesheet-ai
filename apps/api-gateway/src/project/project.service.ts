import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from '@libs/shared-dto';

@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId?: string) {
    const where = tenantId ? { tenantId } : {};
    return this.prisma.project.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, tenantId?: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    if (tenantId && project.tenantId !== tenantId) {
      throw new ForbiddenException('Cross-tenant resource access is forbidden');
    }
    return project;
  }

  async create(dto: CreateProjectDto, tenantId: string) {
    return this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        isActive: dto.isActive ?? true,
        tenantId,
      },
    });
  }

  async update(id: string, dto: UpdateProjectDto, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.project.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }
}
