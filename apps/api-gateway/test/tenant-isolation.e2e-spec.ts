import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ExecutionContext, ForbiddenException } from '@nestjs/common';
import * as request from 'supertest';
import { ProjectController } from '../src/project/project.controller';
import { ProjectService } from '../src/project/project.service';
import { TimeEntryController } from '../src/time-entry/time-entry.controller';
import { TimeEntryService } from '../src/time-entry/time-entry.service';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { TenantGuard } from '../src/auth/tenant.guard';
import { TenantInterceptor } from '../src/auth/tenant.interceptor';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Multi-Tenant Isolation & Standalone E2E Tests', () => {
  let app: INestApplication;
  const originalEnvMode = process.env.ENV_MODE;

  const PROJECT_A_ID = '11111111-1111-4111-8111-111111111111';
  const PROJECT_B_ID = '22222222-2222-4222-8222-222222222222';

  // Mock in-memory database store
  const projects = [
    { id: PROJECT_A_ID, name: 'Project Alpha', tenantId: 'tenant-a', isActive: true },
    { id: PROJECT_B_ID, name: 'Project Beta', tenantId: 'tenant-b', isActive: true },
  ];

  const timeEntries: any[] = [
    { id: 'entry-a-1', userId: 'user-a', projectId: PROJECT_A_ID, date: new Date(), durationMinutes: 120, rawComment: 'Dev work', project: projects[0] },
    { id: 'entry-b-1', userId: 'user-b', projectId: PROJECT_B_ID, date: new Date(), durationMinutes: 180, rawComment: 'Beta work', project: projects[1] },
  ];

  const mockPrismaService = {
    project: {
      findMany: jest.fn().mockImplementation(({ where }) => {
        return projects.filter((p) => !where?.tenantId || p.tenantId === where.tenantId);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        return projects.find((p) => p.id === where.id) || null;
      }),
      create: jest.fn().mockImplementation(({ data }) => {
        const newProj = { id: `proj-${Date.now()}`, ...data };
        projects.push(newProj);
        return newProj;
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const proj = projects.find((p) => p.id === where.id);
        return { ...proj, ...data };
      }),
    },
    timeEntry: {
      findMany: jest.fn().mockImplementation(({ where }) => {
        return timeEntries.filter((e) => {
          if (where.userId && e.userId !== where.userId) return false;
          if (where.project?.tenantId && e.project.tenantId !== where.project.tenantId) return false;
          return true;
        });
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        return timeEntries.find((e) => e.id === where.id) || null;
      }),
      create: jest.fn().mockImplementation(({ data, include }) => {
        const proj = projects.find((p) => p.id === data.projectId);
        const newEntry = { id: `entry-${Date.now()}`, ...data, project: proj };
        timeEntries.push(newEntry);
        return newEntry;
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const entry = timeEntries.find((e) => e.id === where.id);
        return { ...entry, ...data };
      }),
      delete: jest.fn().mockImplementation(({ where }) => {
        const idx = timeEntries.findIndex((e) => e.id === where.id);
        if (idx !== -1) timeEntries.splice(idx, 1);
        return { id: where.id };
      }),
    },
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ProjectController, TimeEntryController],
      providers: [
        ProjectService,
        TimeEntryService,
        TenantGuard,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          const authHeader = req.headers['authorization'];
          if (!authHeader) return false;
          // Token format: "Bearer <userId>:<tenantId>" or "Bearer <userId>"
          const token = authHeader.replace('Bearer ', '').trim();
          const [userId, tenantId] = token.split(':');
          req.user = {
            id: userId,
            tenantId: tenantId || undefined,
            email: `${userId}@example.com`,
          };
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new TenantInterceptor());
    await app.init();
  });

  afterAll(async () => {
    process.env.ENV_MODE = originalEnvMode;
    await app.close();
  });

  describe('Multi-Tenant Boundary Isolation', () => {
    beforeEach(() => {
      delete process.env.ENV_MODE;
    });

    it('should allow Tenant A user to fetch projects belonging to Tenant A', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/projects')
        .set('Authorization', 'Bearer user-a:tenant-a');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.every((p: any) => p.tenantId === 'tenant-a')).toBe(true);
    });

    it('should reject requests when Tenant A user attempts to access a project belonging to Tenant B (403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/projects/${PROJECT_B_ID}`)
        .set('Authorization', 'Bearer user-a:tenant-a');

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Cross-tenant resource access is forbidden');
    });

    it('should allow Tenant B user to access its own project', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/projects/${PROJECT_B_ID}`)
        .set('Authorization', 'Bearer user-b:tenant-b');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(PROJECT_B_ID);
      expect(res.body.tenantId).toBe('tenant-b');
    });

    it('should reject creating a time entry associated with another tenant project (403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/time-entries')
        .set('Authorization', 'Bearer user-a:tenant-a')
        .send({
          projectId: PROJECT_B_ID,
          date: new Date().toISOString(),
          durationMinutes: 60,
          rawComment: 'Unauthorized time logging attempt',
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Cannot associate time entry with a project belonging to another tenant');
    });

    it('should allow creating a time entry associated with own tenant project (201 Created)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/time-entries')
        .set('Authorization', 'Bearer user-a:tenant-a')
        .send({
          projectId: PROJECT_A_ID,
          date: new Date().toISOString(),
          durationMinutes: 90,
          rawComment: 'Legitimate task in tenant A',
        });

      expect(res.status).toBe(201);
      expect(res.body.projectId).toBe(PROJECT_A_ID);
    });

    it('should reject cross-tenant time entry deletion (403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .delete('/api/time-entries/entry-b-1')
        .set('Authorization', 'Bearer user-a:tenant-a');

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Cross-tenant resource modification is forbidden');
    });

    it('should reject request missing tenant context in token and header (403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/projects')
        .set('Authorization', 'Bearer user-no-tenant');

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Missing tenant context');
    });
  });

  describe('Self-Hosted Standalone Mode Overrides', () => {
    beforeEach(() => {
      process.env.ENV_MODE = 'SELF_HOSTED';
    });

    afterEach(() => {
      delete process.env.ENV_MODE;
    });

    it('should bypass tenant header requirement when ENV_MODE=SELF_HOSTED', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/projects')
        .set('Authorization', 'Bearer solo-dev');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
