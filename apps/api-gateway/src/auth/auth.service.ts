import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { RegisterDto, LoginDto, RefreshTokenDto } from '@libs/shared-dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async register(dto: RegisterDto) {
    // 1. Check if email already registered
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email address is already registered');
    }

    // 2. Check or create tenant
    let tenant = await this.prisma.tenant.findUnique({
      where: { slug: dto.tenantSlug },
    });

    if (!tenant) {
      tenant = await this.prisma.tenant.create({
        data: {
          name: dto.tenantName,
          slug: dto.tenantSlug,
        },
      });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 4. Create Admin User for the Tenant
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name || 'Admin',
        password: hashedPassword,
        role: Role.ADMIN,
        tenantId: tenant.id,
      },
    });

    // 5. Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        projectAssignments: {
          select: { projectId: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password credentials');
    }

    const tokens = await this.generateTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        assignedProjectIds: user.projectAssignments.map((pa) => pa.projectId),
      },
      ...tokens,
    };
  }

  async refresh(dto: RefreshTokenDto) {
    const record = await this.prisma.refreshToken.findUnique({
      where: { token: dto.refreshToken },
      include: { user: true },
    });

    if (!record || record.isRevoked || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const payload = {
      sub: record.user.id,
      email: record.user.email,
      role: record.user.role,
      tenantId: record.user.tenantId,
    };

    const accessToken = this.jwtService.sign(payload);
    return { accessToken };
  }

  async validateSession(rawToken: string) {
    try {
      const cleanToken = rawToken.replace(/^Bearer\s+/i, '');
      const payload = this.jwtService.verify(cleanToken, {
        secret: process.env.JWT_SECRET || 'development-secret',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          projectAssignments: {
            select: { projectId: true },
          },
        },
      });

      if (!user) {
        return { valid: false };
      }

      return {
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
          assignedProjectIds: user.projectAssignments.map((pa) => pa.projectId),
        },
      };
    } catch {
      return { valid: false };
    }
  }

  private async generateTokens(user: {
    id: string;
    email: string;
    role: Role;
    tenantId: string;
  }) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

    // Generate DB-backed refresh token valid for 7 days
    const refreshTokenString = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenString,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenString,
    };
  }
}
