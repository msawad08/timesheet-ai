import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { TimeEntryService } from './time-entry.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TimeEntryService Unit Tests', () => {
  let service: TimeEntryService;
  let prisma: {
    timeEntry: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    project: {
      findUnique: jest.Mock;
    };
  };

  const mockProject = {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Backend API',
    tenantId: 'tenant-123',
  };

  const mockTimeEntry = {
    id: 'entry-123',
    userId: 'user-456',
    projectId: mockProject.id,
    date: new Date('2026-10-01'),
    durationMinutes: 120,
    rawComment: 'Engine refactoring',
    enrichedComment: 'Engine refactoring',
    project: mockProject,
  };

  beforeEach(async () => {
    prisma = {
      timeEntry: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      project: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimeEntryService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<TimeEntryService>(TimeEntryService);
  });

  describe('findAllForUser', () => {
    it('should return entries for the given user', async () => {
      prisma.timeEntry.findMany.mockResolvedValue([mockTimeEntry]);

      const result = await service.findAllForUser('user-456');
      expect(result).toEqual([mockTimeEntry]);
      expect(prisma.timeEntry.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-456' },
        include: { project: { select: { id: true, name: true } } },
        orderBy: { date: 'desc' },
      });
    });

    it('should filter by tenant context when provided', async () => {
      prisma.timeEntry.findMany.mockResolvedValue([mockTimeEntry]);

      const result = await service.findAllForUser('user-456', 'tenant-123');
      expect(result).toEqual([mockTimeEntry]);
      expect(prisma.timeEntry.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-456', project: { tenantId: 'tenant-123' } },
        include: { project: { select: { id: true, name: true } } },
        orderBy: { date: 'desc' },
      });
    });
  });

  describe('create', () => {
    const createDto = {
      projectId: mockProject.id,
      date: '2026-10-01',
      durationMinutes: 120,
      rawComment: 'Refactor DB layer',
    };

    it('should successfully create a time entry when project matches tenant', async () => {
      prisma.project.findUnique.mockResolvedValue(mockProject);
      prisma.timeEntry.create.mockResolvedValue(mockTimeEntry);

      const result = await service.create(createDto, 'user-456', 'tenant-123');
      expect(result).toEqual(mockTimeEntry);
      expect(prisma.timeEntry.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-456',
          projectId: mockProject.id,
          date: expect.any(Date),
          durationMinutes: 120,
          rawComment: 'Refactor DB layer',
          enrichedComment: 'Refactor DB layer',
        },
        include: {
          project: {
            select: { id: true, name: true },
          },
        },
      });
    });

    it('should throw NotFoundException if associated project is not found', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto, 'user-456', 'tenant-123')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw ForbiddenException if project belongs to another tenant', async () => {
      prisma.project.findUnique.mockResolvedValue({
        ...mockProject,
        tenantId: 'different-tenant',
      });

      await expect(service.create(createDto, 'user-456', 'tenant-123')).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('update', () => {
    it('should update entry when user and tenant match', async () => {
      prisma.timeEntry.findUnique.mockResolvedValue(mockTimeEntry);
      prisma.timeEntry.update.mockResolvedValue({
        ...mockTimeEntry,
        durationMinutes: 180,
      });

      const result = await service.update(
        'entry-123',
        { durationMinutes: 180 },
        'user-456',
        'tenant-123'
      );
      expect(result.durationMinutes).toBe(180);
    });

    it('should throw NotFoundException if entry not found', async () => {
      prisma.timeEntry.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { durationMinutes: 60 }, 'user-456', 'tenant-123')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when attempting cross-user update', async () => {
      prisma.timeEntry.findUnique.mockResolvedValue(mockTimeEntry);

      await expect(
        service.update('entry-123', { durationMinutes: 60 }, 'different-user', 'tenant-123')
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when attempting cross-tenant update', async () => {
      prisma.timeEntry.findUnique.mockResolvedValue({
        ...mockTimeEntry,
        project: { ...mockProject, tenantId: 'different-tenant' },
      });

      await expect(
        service.update('entry-123', { durationMinutes: 60 }, 'user-456', 'tenant-123')
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('should delete entry when user and tenant match', async () => {
      prisma.timeEntry.findUnique.mockResolvedValue(mockTimeEntry);
      prisma.timeEntry.delete.mockResolvedValue(mockTimeEntry);

      const result = await service.delete('entry-123', 'user-456', 'tenant-123');
      expect(result).toEqual(mockTimeEntry);
      expect(prisma.timeEntry.delete).toHaveBeenCalledWith({
        where: { id: 'entry-123' },
      });
    });

    it('should throw ForbiddenException if user does not own entry', async () => {
      prisma.timeEntry.findUnique.mockResolvedValue(mockTimeEntry);

      await expect(
        service.delete('entry-123', 'attacker-user', 'tenant-123')
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
