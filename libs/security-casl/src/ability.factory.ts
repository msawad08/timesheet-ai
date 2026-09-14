import {
  AbilityBuilder,
  createMongoAbility,
  subject,
} from '@casl/ability';
import { PrismaClient, Role } from '@prisma/client';
import { Actions, AppSubjects, AppAbility, CurrentUserContext } from './casl.types';

export class AbilityFactory {
  constructor(
    private readonly prisma?: PrismaClient,
    private readonly redisClient?: any
  ) {}

  /**
   * Compiles dynamic CASL abilities for a specific user within their tenant context
   */
  async createForUser(user: CurrentUserContext): Promise<AppAbility> {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(
      createMongoAbility
    );

    // Superadmin & Admin have full system access
    if (user.role === Role.SUPERADMIN || user.role === Role.ADMIN) {
      can('manage', 'all');
      return this.wrapAbility(build());
    }

    // Default baseline rules based on Role
    if (user.role === Role.DEVELOPER) {
      can('read', 'Project', { tenantId: user.tenantId } as any);
      can('read', 'TimeEntry', { userId: user.id, tenantId: user.tenantId } as any);
      can('create', 'TimeEntry', { userId: user.id, tenantId: user.tenantId } as any);
      can('update', 'TimeEntry', { userId: user.id, tenantId: user.tenantId } as any);
      can('delete', 'TimeEntry', { userId: user.id, tenantId: user.tenantId } as any);
    } else if (user.role === Role.MANAGER) {
      can('read', 'Project', { tenantId: user.tenantId } as any);
      can('create', 'Project', { tenantId: user.tenantId } as any);
      can('update', 'Project', { tenantId: user.tenantId } as any);
      can('read', 'TimeEntry', { tenantId: user.tenantId } as any);
      can('manage', 'TimeEntry', { tenantId: user.tenantId } as any);
    }

    // If database is connected, query and compile dynamic PermissionRules
    if (this.prisma) {
      try {
        const dynamicRules = await this.prisma.permissionRule.findMany({
          where: {
            tenantId: user.tenantId,
            OR: [
              { userId: user.id },
              { role: user.role },
            ],
          },
        });

        for (const rule of dynamicRules) {
          let conditions: any = undefined;

          if (rule.conditions) {
            try {
              // Interpolate variables like ${user.id} and ${user.tenantId}
              const interpolatedConditions = rule.conditions
                .replace(/\$\{user\.id\}/g, user.id)
                .replace(/\$\{user\.tenantId\}/g, user.tenantId);

              conditions = JSON.parse(interpolatedConditions);
            } catch (err) {
              console.warn(`Failed to parse conditions for rule ${rule.id}:`, err);
            }
          }

          const action = rule.action as Actions;
          const subjectType = rule.subject as AppSubjects;

          if (rule.inverted) {
            cannot(action, subjectType, conditions as any);
          } else {
            can(action, subjectType, conditions as any);
          }
        }
      } catch (err) {
        console.warn('Error fetching dynamic permission rules from database:', err);
      }
    }

    return this.wrapAbility(build());
  }

  /**
   * Enhances ability.can so passing (action, 'SubjectType', object) automatically wraps with subject helper
   */
  private wrapAbility(ability: AppAbility): AppAbility {
    const origCan = ability.can.bind(ability);
    (ability as any).can = (action: any, subj: any, extra?: any) => {
      if (typeof subj === 'string' && typeof extra === 'object' && extra !== null) {
        return origCan(action, subject(subj, extra));
      }
      return origCan(action, subj, extra);
    };
    return ability;
  }

  /**
   * Retrieves permissions using the Redis Cache-Aside pattern (30-minute TTL)
   */
  async getCachedAbility(user: CurrentUserContext): Promise<AppAbility> {
    if (!this.redisClient) {
      return this.createForUser(user);
    }

    const cacheKey = `auth:rules:${user.id}`;

    try {
      const cached = await this.redisClient.get(cacheKey);
      if (cached) {
        const rules = JSON.parse(cached);
        return this.wrapAbility(createMongoAbility(rules));
      }
    } catch (err) {
      console.warn(`Redis read error for key ${cacheKey}:`, err);
    }

    const ability = await this.createForUser(user);

    try {
      await this.redisClient.set(
        cacheKey,
        JSON.stringify(ability.rules),
        'EX',
        1800 // 30 minutes TTL
      );
    } catch (err) {
      console.warn(`Redis write error for key ${cacheKey}:`, err);
    }

    return ability;
  }

  /**
   * Invalidates cached permissions for a user
   */
  async invalidateUserCache(userId: string): Promise<void> {
    if (!this.redisClient) return;
    try {
      await this.redisClient.del(`auth:rules:${userId}`);
    } catch (err) {
      console.warn(`Failed to invalidate cache for user ${userId}:`, err);
    }
  }

  /**
   * Invalidates cached permissions for all users having a specific role in a tenant
   */
  async invalidateRoleCache(role: Role, tenantId: string): Promise<void> {
    if (!this.redisClient || !this.prisma) return;

    try {
      const users = await this.prisma.user.findMany({
        where: { role, tenantId },
        select: { id: true },
      });

      const keys = users.map((u) => `auth:rules:${u.id}`);
      if (keys.length > 0) {
        await this.redisClient.del(...keys);
      }
    } catch (err) {
      console.warn(`Failed to invalidate role cache for ${role}:`, err);
    }
  }
}
