import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // 1. Self-hosted mode bypass: If running in self-hosted standalone mode, tenancy checks are relaxed
    if (process.env.ENV_MODE === 'SELF_HOSTED') {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const headerTenantSlug = request.headers['x-tenant-slug'];

    // If authenticated via JWT, user.tenantId is verified
    if (user && user.tenantId) {
      request.tenantId = user.tenantId;
      return true;
    }

    // If tenant slug header is supplied on public/registration routes
    if (headerTenantSlug) {
      request.tenantSlug = headerTenantSlug;
      return true;
    }

    // Otherwise block unauthorized access across tenant boundaries
    throw new ForbiddenException('Missing tenant context in session or headers');
  }
}
