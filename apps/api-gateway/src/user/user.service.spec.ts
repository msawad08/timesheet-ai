import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { Role } from '@prisma/client';

describe('UserService Unit Tests', () => {
  let service: UserService;
  let prisma: {
    user: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };
  let redis: {
    del: jest.Mock;
  };

  const mockUser = {
    id: 'user-1111-2222',
    email: 'alice@default.com',
    name: 'Alice Cooper',
    role: Role.DEVELOPER,
    tenantId: 'tenant-alpha',
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: {
      projectAssignments: 2,
      timeEntries: 10,
    },
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    redis = {
      del: jest.fn().mockResolvedValue(1),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  describe('findAll', () => {
    it('should return all users filtered by tenantId', async () => {
      prisma.user.findMany.mockResolvedValue([mockUser]);

      const result = await service.findAll('tenant-alpha');
      expect(result).toEqual([mockUser]);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-alpha' },
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return user when tenant matches', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne(mockUser.id, 'tenant-alpha');
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user is missing', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw ForbiddenException if user belongs to another tenant', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.findOne(mockUser.id, 'tenant-beta')).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('invite', () => {
    it('should create new user with hashed password and tenant context', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'new-user-id',
        email: 'bob@default.com',
        name: 'Bob',
        role: Role.MANAGER,
        tenantId: 'tenant-alpha',
        createdAt: new Date(),
      });

      const result = await service.invite(
        { email: 'bob@default.com', name: 'Bob', role: 'MANAGER' },
        'tenant-alpha'
      );
      expect(result.email).toBe('bob@default.com');
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'bob@default.com',
          name: 'Bob',
          role: Role.MANAGER,
          tenantId: 'tenant-alpha',
        }),
        select: expect.any(Object),
      });
    });

    it('should throw ConflictException if email is already registered', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.invite({ email: mockUser.email, role: 'DEVELOPER' }, 'tenant-alpha')
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateRole', () => {
    it('should update user role and invalidate redis ABAC cache', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({
        ...mockUser,
        role: Role.ADMIN,
      });

      const result = await service.updateRole(
        mockUser.id,
        { role: 'ADMIN' },
        'tenant-alpha'
      );
      expect(result.role).toBe(Role.ADMIN);
      expect(redis.del).toHaveBeenCalledWith(`auth:rules:${mockUser.id}`);
    });
  });

  describe('delete', () => {
    it('should delete user and invalidate redis cache', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.delete.mockResolvedValue(mockUser);

      const result = await service.delete(mockUser.id, 'tenant-alpha');
      expect(result).toEqual(mockUser);
      expect(redis.del).toHaveBeenCalledWith(`auth:rules:${mockUser.id}`);
    });
  });
});
