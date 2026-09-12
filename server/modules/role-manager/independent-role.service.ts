import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, inArray } from 'drizzle-orm';

import { INDEPENDENT_DATABASE, type IndependentDatabase } from '@server/database/database.module';
import { roles, userRoles, users } from '@server/database/independent-schema';
import type { AddMembersRequest, CreateRoleRequest, RemoveMembersRequest, UpdateRoleRequest } from '@shared/api.interface';
import { AuditService } from '@server/modules/auth/audit.service';

function displayName(name: string) {
  return { zh_cn: name };
}

@Injectable()
export class IndependentRoleService {
  constructor(@Inject(INDEPENDENT_DATABASE) private readonly db: IndependentDatabase, private readonly audit: AuditService) {}

  async list() {
    const roleRows = await this.getDb().select().from(roles).orderBy(asc(roles.name));
    return Promise.all(roleRows.map((role) => this.toDto(role)));
  }

  async get(roleKey: string) {
    const [role] = await this.getDb().select().from(roles).where(eq(roles.roleKey, roleKey)).limit(1);
    if (!role) throw new NotFoundException('角色不存在');
    return this.toDto(role);
  }

  async create(dto: CreateRoleRequest, actorId?: string) {
    const [created] = await this.getDb().insert(roles).values({
      roleKey: dto.role.bizID,
      name: dto.role.name,
      description: dto.role.description ?? null,
    }).returning({ roleKey: roles.roleKey });
    await this.audit.record({ userId: actorId, action: 'admin.role_created', resource: 'role', metadata: { roleKey: created.roleKey } });
    return { bizID: created.roleKey, apiID: created.roleKey };
  }

  async update(roleKey: string, dto: UpdateRoleRequest, actorId?: string) {
    await this.requireRole(roleKey);
    await this.getDb().update(roles).set({
      name: dto.role.name,
      description: dto.role.description,
      updatedAt: new Date(),
    }).where(eq(roles.roleKey, roleKey));
    await this.audit.record({ userId: actorId, action: 'admin.role_updated', resource: 'role', metadata: { roleKey } });
    return { ok: true };
  }

  async delete(roleKey: string, actorId?: string) {
    await this.requireRole(roleKey);
    await this.getDb().delete(roles).where(eq(roles.roleKey, roleKey));
    await this.audit.record({ userId: actorId, action: 'admin.role_deleted', resource: 'role', metadata: { roleKey } });
    return { ok: true };
  }

  async listMembers(roleKey: string, page = 1, pageSize = 50) {
    const role = await this.requireRole(roleKey);
    const rows = await this.getDb().select({ id: users.id, displayName: users.displayName, avatarUrl: users.avatarUrl, email: users.email })
      .from(userRoles)
      .innerJoin(users, eq(userRoles.userId, users.id))
      .where(eq(userRoles.roleId, role.id))
      .orderBy(asc(users.displayName));
    const start = Math.max(0, (page - 1) * pageSize);
    const members = rows.slice(start, start + pageSize).map((user) => ({
      userID: user.id,
      name: displayName(user.displayName),
      avatar: user.avatarUrl,
      email: user.email ?? undefined,
    }));
    return { members: { userList: members }, total: rows.length, hasMore: start + pageSize < rows.length };
  }

  async addMembers(roleKey: string, dto: AddMembersRequest, actorId?: string) {
    const role = await this.requireRole(roleKey);
    const ids = (dto.members.userList ?? []).map((member) => member.userID).filter((id): id is string => Boolean(id));
    if (ids.length) await this.getDb().insert(userRoles).values(ids.map((userId) => ({ userId, roleId: role.id }))).onConflictDoNothing();
    await this.audit.record({ userId: actorId, action: 'admin.role_members_added', resource: 'role', metadata: { roleKey, userIds: ids } });
    return { ok: true };
  }

  async removeMembers(roleKey: string, dto: RemoveMembersRequest, actorId?: string) {
    const role = await this.requireRole(roleKey);
    const ids = (dto.members.userList ?? []).map((member) => member.userID).filter((id): id is string => Boolean(id));
    if (ids.length) await this.getDb().delete(userRoles).where(and(eq(userRoles.roleId, role.id), inArray(userRoles.userId, ids)));
    await this.audit.record({ userId: actorId, action: 'admin.role_members_removed', resource: 'role', metadata: { roleKey, userIds: ids } });
    return { ok: true };
  }

  async clearMembers(roleKey: string, actorId?: string) {
    const role = await this.requireRole(roleKey);
    await this.getDb().delete(userRoles).where(eq(userRoles.roleId, role.id));
    await this.audit.record({ userId: actorId, action: 'admin.role_members_cleared', resource: 'role', metadata: { roleKey } });
    return { ok: true };
  }

  async search(query: string, page = 1, pageSize = 50) {
    const rows = await this.getDb().select({ id: users.id, displayName: users.displayName, avatarUrl: users.avatarUrl, email: users.email })
      .from(users)
      .where(eq(users.status, 'active'))
      .orderBy(asc(users.displayName));
    const normalized = query.trim().toLowerCase();
    const matched = normalized ? rows.filter((user) => `${user.displayName} ${user.email ?? ''} ${user.id}`.toLowerCase().includes(normalized)) : rows;
    const start = Math.max(0, (page - 1) * pageSize);
    return {
      users: matched.slice(start, start + pageSize).map((user) => ({ userID: user.id, name: displayName(user.displayName), avatar: user.avatarUrl, email: user.email ?? undefined })),
      total: matched.length,
      hasMore: start + pageSize < matched.length,
    };
  }

  private async requireRole(roleKey: string) {
    const [role] = await this.getDb().select().from(roles).where(eq(roles.roleKey, roleKey)).limit(1);
    if (!role) throw new NotFoundException('角色不存在');
    return role;
  }

  private getDb() {
    return this.db;
  }

  private async toDto(role: typeof roles.$inferSelect) {
    const members = await this.listMembers(role.roleKey, 1, 1000);
    return {
      bizID: role.roleKey,
      apiID: role.roleKey,
      name: role.name,
      description: role.description ?? undefined,
      roleMembers: members.members,
    };
  }
}
