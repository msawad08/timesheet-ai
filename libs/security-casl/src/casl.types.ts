import { MongoAbility } from '@casl/ability';
import { Role } from '@prisma/client';

export type Actions = 'manage' | 'create' | 'read' | 'update' | 'delete';

export type AppSubjects =
  | 'User'
  | 'Project'
  | 'TimeEntry'
  | 'PermissionRule'
  | 'Tenant'
  | 'all';

export type AppAbility = MongoAbility<[Actions, AppSubjects]>;

export interface CurrentUserContext {
  id: string;
  email: string;
  role: Role;
  tenantId: string;
  assignedProjectIds?: string[];
}
