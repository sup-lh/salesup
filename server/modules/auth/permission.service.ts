import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { INDEPENDENT_DATABASE, type IndependentDatabase } from '@server/database/database.module';
import { permissions, rolePermissions, roles, userRoles } from '@server/database/independent-schema';

@Injectable()
export class PermissionService {
  constructor(@Inject(INDEPENDENT_DATABASE) private readonly db: IndependentDatabase) {}

  async listRoleKeys(userId: string): Promise<string[]> {
    const rows = await this.db
      .select({ roleKey: roles.roleKey })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));
    return rows.map((row) => row.roleKey);
  }

  async hasPermission(userId: string, action: string, subject: string): Promise<boolean> {
    const rows = await this.db
      .select({ permissionId: permissions.id })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(and(eq(userRoles.userId, userId), eq(permissions.action, action), eq(permissions.subject, subject)))
      .limit(1);
    return rows.length > 0;
  }

  async listPermissions(userId: string): Promise<Array<{ action: string; subject: string }>> {
    return this.db
      .select({ action: permissions.action, subject: permissions.subject })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(userRoles.userId, userId));
  }
}
