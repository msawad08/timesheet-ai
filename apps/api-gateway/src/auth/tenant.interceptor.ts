import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // In self-hosted mode, populate default tenant context so tenancy headers are optional
    if (process.env.ENV_MODE === 'SELF_HOSTED') {
      request.tenantSlug = request.headers['x-tenant-slug'] || 'default';
      if (request.user && !request.user.tenantId) {
        request.user.tenantId = 'default-tenant';
      }
      if (!request.tenantId) {
        request.tenantId = (request.user && request.user.tenantId) || 'default-tenant';
      }
    }

    return next.handle();
  }
}
