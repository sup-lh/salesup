import { Controller, Get, Post, Body, Inject, Req } from '@nestjs/common';
import { Can } from '@server/common/auth/auth.decorators';
import type { IndependentRequest } from '@server/common/auth/auth.types';
import { eq, and, inArray } from 'drizzle-orm';
import { INDEPENDENT_DATABASE, type IndependentDatabase } from '@server/database/database.module';
import { permissions, rolePermissions, roles } from '@server/database/independent-schema';
import type {
  PermissionItem,
  RolePermissionMapping,
  BatchUpdateRoleMappingsRequest,
} from '@shared/api.interface';
import { AuditService } from '@server/modules/auth/audit.service';

@Controller('api/permissions')
export class PermissionController {
  constructor(
    @Inject(INDEPENDENT_DATABASE) private readonly db: IndependentDatabase,
    private readonly audit: AuditService,
  ) {}

  @Can('manage', 'Permission')
  @Get()
  async listPermissions(): Promise<PermissionItem[]> {
    return this.db.select({
        id: permissions.id,
        action: permissions.action,
        subject: permissions.subject,
        description: permissions.description,
      }).from(permissions);
  }

  @Can('manage', 'Permission')
  @Get('role-mappings')
  async listRoleMappings(): Promise<RolePermissionMapping[]> {
    const rows = await this.db.select({
        id: rolePermissions.roleId,
        roleKey: roles.roleKey,
        permissionId: rolePermissions.permissionId,
      }).from(rolePermissions).innerJoin(roles, eq(rolePermissions.roleId, roles.id));
    return rows;
  }

  @Can('manage', 'Permission')
  @Post('role-mappings/batch')
  async batchUpdateRoleMappings(
    @Req() request: IndependentRequest,
    @Body() dto: BatchUpdateRoleMappingsRequest,
  ): Promise<void> {
    const [role] = await this.db.select({ id: roles.id }).from(roles).where(eq(roles.roleKey, dto.roleKey)).limit(1);
    if (!role) return;
    await this.db.transaction(async (tx) => {
        if (dto.remove.length > 0) {
          await tx.delete(rolePermissions).where(and(eq(rolePermissions.roleId, role.id), inArray(rolePermissions.permissionId, dto.remove)));
        }
        if (dto.add.length > 0) {
          await tx.insert(rolePermissions).values(dto.add.map((permissionId) => ({ roleId: role.id, permissionId }))).onConflictDoNothing();
        }
    });
    await this.audit.record({ userId: request.independentUserContext!.userId, action: 'admin.permissions_updated', resource: 'role', metadata: { roleKey: dto.roleKey, added: dto.add, removed: dto.remove } });
  }
}
