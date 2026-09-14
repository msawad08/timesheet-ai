import { Role } from '@prisma/client';
import { AbilityFactory } from '../src/ability.factory';
import { CurrentUserContext } from '../src/casl.types';

describe('AbilityFactory Permissions Enforcement', () => {
  let abilityFactory: AbilityFactory;

  beforeEach(() => {
    abilityFactory = new AbilityFactory();
  });

  it('should allow developers to modify only their own time entries', async () => {
    const mockDeveloper: CurrentUserContext = {
      id: 'dev-1',
      email: 'dev1@default.com',
      role: Role.DEVELOPER,
      tenantId: 'tenant-a',
    };

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

  it('should allow admins to manage all resources', async () => {
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
