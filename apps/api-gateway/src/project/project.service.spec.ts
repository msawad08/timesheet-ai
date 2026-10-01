import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ProjectService } from './project.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProjectService Unit Tests', () => {
  let service: ProjectService;
  let prisma: {
    project: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  const mockProject = {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Frontend Redesign',
    description: 'Next.js UI migration',
    isActive: true,
    tenantId: 'tenant-alpha',
  };

  beforeEach(async () => {
    prisma = {
      project: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
  });

  describe('findAll', () => {
    it('should return all projects when tenantId is not provided', async () => {
      prisma.project.findMany.mockResolvedValue([mockProject]);

      const result = await service.findAll();
      expect(result).toEqual([mockProject]);
      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { name: 'asc' },
      });
    });

    it('should filter projects by tenantId when provided', async () => {
      prisma.project.findMany.mockResolvedValue([mockProject]);

      const result = await service.findAll('tenant-alpha');
      expect(result).toEqual([mockProject]);
      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-alpha' },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return the project when it exists and belongs to tenant', async () => {
      prisma.project.findUnique.mockResolvedValue(mockProject);

      const result = await service.findOne(mockProject.id, 'tenant-alpha');
      expect(result).toEqual(mockProject);
    });

    it('should throw NotFoundException if project is missing', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if project belongs to another tenant', async () => {
      prisma.project.findUnique.mockResolvedValue(mockProject);

      await expect(
        service.findOne(mockProject.id, 'tenant-beta')
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('create', () => {
    it('should create a project with tenant context', async () => {
      const dto = {
        name: 'Billing API',
        description: 'Stripe integration',
        isActive: true,
      };
      prisma.project.create.mockResolvedValue({
        id: '22222222-2222-4222-8222-222222222222',
        ...dto,
        tenantId: 'tenant-alpha',
      });

      const result = await service.create(dto, 'tenant-alpha');
      expect(result.name).toBe('Billing API');
      expect(prisma.project.create).toHaveBeenCalledWith({
        data: {
          name: dto.name,
          description: dto.description,
          isActive: true,
          tenantId: 'tenant-alpha',
        },
      });
    });
  });

  describe('update', () => {
    it('should update project fields after verifying tenant access', async () => {
      prisma.project.findUnique.mockResolvedValue(mockProject);
      prisma.project.update.mockResolvedValue({
        ...mockProject,
        name: 'Updated Name',
      });

      const result = await service.update(
        mockProject.id,
        { name: 'Updated Name' },
        'tenant-alpha'
      );
      expect(result.name).toBe('Updated Name');
      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: mockProject.id },
        data: { name: 'Updated Name' },
      });
    });
  });

  describe('delete', () => {
    it('should delete project after verifying tenant access', async () => {
      prisma.project.findUnique.mockResolvedValue(mockProject);
      prisma.project.delete.mockResolvedValue(mockProject);

      const result = await service.delete(mockProject.id, 'tenant-alpha');
      expect(result).toEqual(mockProject);
      expect(prisma.project.delete).toHaveBeenCalledWith({
        where: { id: mockProject.id },
      });
    });
  });
});
