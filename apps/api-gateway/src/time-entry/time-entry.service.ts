import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTimeEntryDto, UpdateTimeEntryDto } from '@libs/shared-dto';

@Injectable()
export class TimeEntryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllForUser(userId: string, tenantId?: string) {
    const where: any = { userId };
    if (tenantId) {
      where.project = { tenantId };
    }

    return this.prisma.timeEntry.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async create(dto: CreateTimeEntryDto, userId: string, tenantId?: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (tenantId && project.tenantId !== tenantId) {
      throw new ForbiddenException('Cannot associate time entry with a project belonging to another tenant');
    }

    return this.prisma.timeEntry.create({
      data: {
        userId,
        projectId: dto.projectId,
        date: new Date(dto.date),
        durationMinutes: dto.durationMinutes,
        rawComment: dto.rawComment,
        enrichedComment: dto.rawComment || 'Standard timesheet log entry',
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async update(id: string, dto: UpdateTimeEntryDto, userId: string, tenantId?: string) {
    const existing = await this.prisma.timeEntry.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existing) {
      throw new NotFoundException('Time entry not found');
    }

    if (tenantId && existing.project.tenantId !== tenantId) {
      throw new ForbiddenException('Cross-tenant resource modification is forbidden');
    }

    if (userId && existing.userId !== userId) {
      throw new ForbiddenException('Cannot modify time entry of another user');
    }

    return this.prisma.timeEntry.update({
      where: { id },
      data: {
        ...(dto.projectId ? { projectId: dto.projectId } : {}),
        ...(dto.date ? { date: new Date(dto.date) } : {}),
        ...(dto.durationMinutes ? { durationMinutes: dto.durationMinutes } : {}),
        ...(dto.rawComment !== undefined ? { rawComment: dto.rawComment } : {}),
        ...(dto.enrichedComment !== undefined ? { enrichedComment: dto.enrichedComment } : {}),
      },
    });
  }

  async delete(id: string, userId: string, tenantId?: string) {
    const existing = await this.prisma.timeEntry.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existing) {
      throw new NotFoundException('Time entry not found');
    }

    if (tenantId && existing.project.tenantId !== tenantId) {
      throw new ForbiddenException('Cross-tenant resource modification is forbidden');
    }

    if (userId && existing.userId !== userId) {
      throw new ForbiddenException('Cannot modify time entry of another user');
    }

    return this.prisma.timeEntry.delete({
      where: { id },
    });
  }
}
