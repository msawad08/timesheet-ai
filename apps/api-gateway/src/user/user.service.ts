import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { InviteUserDto, UpdateUserRoleDto } from '@libs/shared-dto';
import { Role } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async findAll(tenantId?: string) {
    const where = tenantId ? { tenantId } : {};
    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            projectAssignments: true,
            timeEntries: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            projectAssignments: true,
            timeEntries: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (tenantId && user.tenantId !== tenantId) {
      throw new ForbiddenException('Cross-tenant user access is forbidden');
    }

    return user;
  }

  async invite(dto: InviteUserDto, tenantId: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException(`User with email ${dto.email} already exists`);
    }

    const rawPassword = dto.password || 'Password123!';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const validRole = (Object.values(Role).includes(dto.role as Role)
      ? dto.role
      : Role.DEVELOPER) as Role;

    return this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        name: dto.name || dto.email.split('@')[0],
        password: hashedPassword,
        role: validRole,
        tenantId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        createdAt: true,
      },
    });
  }

  async updateRole(id: string, dto: UpdateUserRoleDto, tenantId?: string) {
    await this.findOne(id, tenantId);

    const validRole = (Object.values(Role).includes(dto.role as Role)
      ? dto.role
      : Role.DEVELOPER) as Role;

    const updated = await this.prisma.user.update({
      where: { id },
      data: { role: validRole },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        updatedAt: true,
      },
    });

    // Invalidate cached ABAC permissions in Redis
    await this.redis.del(`auth:rules:${id}`);

    return updated;
  }

  async delete(id: string, tenantId?: string) {
    await this.findOne(id, tenantId);

    const deleted = await this.prisma.user.delete({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    // Invalidate cached ABAC permissions in Redis
    await this.redis.del(`auth:rules:${id}`);

    return deleted;
  }
}
