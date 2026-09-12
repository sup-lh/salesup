import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import {
  AUTH_LOGIN_REQUIRED_KEY,
  AUTH_PERMISSION_KEY,
  type PermissionRequirement,
} from './auth.decorators';
import { PermissionService } from '../../modules/auth/permission.service';
import type { IndependentRequest } from './auth.types';
import { AuditService } from '../../modules/auth/audit.service';

@Injectable()
export class NeedLoginGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly audit: AuditService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<boolean>(AUTH_LOGIN_REQUIRED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;
    const request = context.switchToHttp().getRequest<IndependentRequest>();
    if (!request.independentUserContext) {
      await this.audit.record({ action: 'auth.required', resource: 'route', metadata: { method: request.method, path: request.originalUrl } });
      throw new UnauthorizedException('请先登录');
    }
    return true;
  }
}

@Injectable()
export class CanGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionService: PermissionService,
    private readonly audit: AuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirement = this.reflector.getAllAndOverride<PermissionRequirement>(
      AUTH_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requirement) return true;
    const request = context.switchToHttp().getRequest<IndependentRequest>();
    const user = request.independentUserContext;
    if (!user) throw new UnauthorizedException('请先登录');
    const allowed = await this.permissionService.hasPermission(
      user.userId,
      requirement.action,
      requirement.subject,
    );
    if (!allowed) {
      await this.audit.record({
        userId: user.userId,
        action: 'permission.denied',
        resource: requirement.subject,
        metadata: { permissionAction: requirement.action, method: request.method, path: request.originalUrl },
      });
      throw new ForbiddenException('没有访问权限');
    }
    return true;
  }
}
