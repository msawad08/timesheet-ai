import { Role } from '@prisma/client';
import { AbilityFactory } from '../src/ability.factory';
import { CurrentUserContext } from '../src/casl.types';

describe('AbilityFactory Permissions Enforcement', () => {
  let abilityFactory: AbilityFactory;
  let mockPrisma: any;
  let mockRedis: any;

  beforeEach(() => {
    mockPrisma = {
      permissionRule: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      user: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    mockRedis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
    };

    abilityFactory = new AbilityFactory(mockPrisma, mockRedis);
  });

  describe('Baseline Developer Role', () => {
    const mockDeveloper: CurrentUserContext = {
      id: 'dev-1',
      email: 'dev1@default.com',
      role: Role.DEVELOPER,
      tenantId: 'tenant-a',
    };

    it('should allow developers to modify only their own time entries', async () => {
      const ability = await abilityFactory.createForUser(mockDeveloper);

      const ownEntry = {
        userId: 'dev-1',
        tenantId: 'tenant-a',
        projectId: 'proj-1',
      };

      const foreignEntry = {
        userId: 'dev-2',
        tenantId: 'tenant-a',
        projectId: 'proj-1',
      };

      expect(ability.can('update', 'TimeEntry', ownEntry as any)).toBe(true);
      expect(ability.can('update', 'TimeEntry', foreignEntry as any)).toBe(false);
    });

    it('should block developers from accessing projects from other tenants', async () => {
      const ability = await abilityFactory.createForUser(mockDeveloper);

      const tenantAProject = { id: 'proj-1', tenantId: 'tenant-a' };
      const tenantBProject = { id: 'proj-2', tenantId: 'tenant-b' };

      expect(ability.can('read', 'Project', tenantAProject as any)).toBe(true);
      expect(ability.can('read', 'Project', tenantBProject as any)).toBe(false);
    });
  });

  describe('Baseline Manager Role', () => {
    const mockManager: CurrentUserContext = {
      id: 'mgr-1',
      email: 'mgr@default.com',
      role: Role.MANAGER,
      tenantId: 'tenant-a',
    };

    it('should allow managers to manage time entries within their tenant', async () => {
      const ability = await abilityFactory.createForUser(mockManager);

      const tenantAEntry = {
        userId: 'dev-99',
        tenantId: 'tenant-a',
        projectId: 'proj-1',
      };

      const foreignTenantEntry = {
        userId: 'dev-99',
        tenantId: 'tenant-b',
        projectId: 'proj-2',
      };

      expect(ability.can('manage', 'TimeEntry', tenantAEntry as any)).toBe(true);
      expect(ability.can('manage', 'TimeEntry', foreignTenantEntry as any)).toBe(false);
    });

    it('should allow managers to manage projects within their tenant', async () => {
      const ability = await abilityFactory.createForUser(mockManager);

      const tenantAProject = { id: 'proj-1', tenantId: 'tenant-a' };
      const foreignProject = { id: 'proj-2', tenantId: 'tenant-b' };

      expect(ability.can('create', 'Project', tenantAProject as any)).toBe(true);
      expect(ability.can('update', 'Project', tenantAProject as any)).toBe(true);
      expect(ability.can('read', 'Project', foreignProject as any)).toBe(false);
    });
  });

  describe('Superadmin and Admin Roles', () => {
    it('should allow admins to manage all resources across any tenant', async () => {
      const mockAdmin: CurrentUserContext = {
        id: 'admin-1',
        email: 'admin@default.com',
        role: Role.ADMIN,
        tenantId: 'tenant-a',
      };

      const ability = await abilityFactory.createForUser(mockAdmin);

      expect(ability.can('manage', 'all')).toBe(true);
      expect(ability.can('delete', 'Project')).toBe(true);
      expect(ability.can('update', 'TimeEntry')).toBe(true);
    });
  });

  describe('Dynamic Database PermissionRules Compilation', () => {
    it('should interpolate dynamic ${user.id} variables and apply custom can rules', async () => {
      mockPrisma.permissionRule.findMany.mockResolvedValue([
        {
          id: 'rule-custom-1',
          action: 'read',
          subject: 'TimeEntry',
          conditions: JSON.stringify({ userId: '${user.id}', tenantId: '${user.tenantId}' }),
          inverted: false,
          tenantId: 'tenant-a',
        },
      ]);

      const mockUser: CurrentUserContext = {
        id: 'user-77',
        email: 'u77@default.com',
        role: Role.DEVELOPER,
        tenantId: 'tenant-a',
      };

      const ability = await abilityFactory.createForUser(mockUser);

      expect(
        ability.can('read', 'TimeEntry', {
          userId: 'user-77',
          tenantId: 'tenant-a',
        } as any)
      ).toBe(true);
    });

    it('should enforce inverted (cannot) dynamic rules from the database', async () => {
      mockPrisma.permissionRule.findMany.mockResolvedValue([
        {
          id: 'rule-deny-delete',
          action: 'delete',
          subject: 'TimeEntry',
          conditions: JSON.stringify({ tenantId: 'tenant-a' }),
          inverted: true,
          tenantId: 'tenant-a',
        },
      ]);

      const mockUser: CurrentUserContext = {
        id: 'dev-1',
        email: 'dev@default.com',
        role: Role.DEVELOPER,
        tenantId: 'tenant-a',
      };

      const ability = await abilityFactory.createForUser(mockUser);

      const ownEntry = {
        userId: 'dev-1',
        tenantId: 'tenant-a',
      };

      // Inverted rule blocks delete even if baseline allows it
      expect(ability.can('delete', 'TimeEntry', ownEntry as any)).toBe(false);
    });
  });

  describe('Redis Cache-Aside & Invalidation', () => {
    const mockUser: CurrentUserContext = {
      id: 'dev-cached-1',
      email: 'dev@cached.com',
      role: Role.DEVELOPER,
      tenantId: 'tenant-a',
    };

    it('should return cached rules on Redis hit without querying database', async () => {
      const cachedRules = [
        { action: 'read', subject: 'Project', conditions: { tenantId: 'tenant-a' } },
      ];
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedRules));

      const ability = await abilityFactory.getCachedAbility(mockUser);

      expect(mockRedis.get).toHaveBeenCalledWith('auth:rules:dev-cached-1');
      expect(mockPrisma.permissionRule.findMany).not.toHaveBeenCalled();
      expect(ability.can('read', 'Project', { tenantId: 'tenant-a' } as any)).toBe(true);
    });

    it('should populate Redis on cache miss with 30-minute TTL (1800s)', async () => {
      mockRedis.get.mockResolvedValue(null);

      const ability = await abilityFactory.getCachedAbility(mockUser);

      expect(mockRedis.set).toHaveBeenCalledWith(
        'auth:rules:dev-cached-1',
        expect.any(String),
        'EX',
        1800
      );
      expect(ability).toBeDefined();
    });

    it('should invalidate individual user cache key', async () => {
      await abilityFactory.invalidateUserCache('dev-cached-1');

      expect(mockRedis.del).toHaveBeenCalledWith('auth:rules:dev-cached-1');
    });

    it('should invalidate role cache for all users of that role in tenant', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'user-1' },
        { id: 'user-2' },
      ]);

      await abilityFactory.invalidateRoleCache(Role.DEVELOPER, 'tenant-a');

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { role: Role.DEVELOPER, tenantId: 'tenant-a' },
        select: { id: true },
      });
      expect(mockRedis.del).toHaveBeenCalledWith('auth:rules:user-1', 'auth:rules:user-2');
    });
  });
});
