import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { asc, eq, inArray } from 'drizzle-orm';
import { INDEPENDENT_DATABASE, type IndependentDatabase } from '@server/database/database.module';
import { roles, sessions, userRoles, users } from '@server/database/independent-schema';
import { hashPassword } from '@server/common/auth/password';
import { AuditService } from './audit.service';

@Injectable()
export class AdminUserService {
  constructor(@Inject(INDEPENDENT_DATABASE) private readonly db: IndependentDatabase, private readonly audit: AuditService) {}

  async list(query = '') {
    const rows = await this.db.select({ id: users.id, username: users.username, email: users.email, displayName: users.displayName, status: users.status, mustChangePassword: users.mustChangePassword, lastLoginAt: users.lastLoginAt, createdAt: users.createdAt }).from(users).orderBy(asc(users.displayName));
    const q = query.trim().toLowerCase();
    return q ? rows.filter((row) => `${row.username} ${row.displayName} ${row.email ?? ''}`.toLowerCase().includes(q)) : rows;
  }

  async create(input: { username: string; displayName: string; password: string; email?: string; roleKeys?: string[] }, actorId?: string) {
    if (input.password.length < 10 || !/[A-Za-z]/.test(input.password) || !/\d/.test(input.password)) throw new BadRequestException('初始密码至少 10 位且必须包含字母和数字');
    const [created] = await this.db.insert(users).values({ username: input.username.trim(), displayName: input.displayName.trim(), email: input.email?.trim() || null, passwordHash: await hashPassword(input.password), mustChangePassword: true }).returning({ id: users.id });
    if (!created) throw new ConflictException('创建用户失败');
    await this.assignRoles(created.id, input.roleKeys ?? ['newcomer'], actorId);
    await this.audit.record({ userId: actorId, action: 'admin.user_created', resource: 'user', resourceId: created.id, metadata: { username: input.username.trim() } });
    return { id: created.id };
  }

  async update(id: string, input: { displayName?: string; email?: string; status?: 'active' | 'disabled' }, actorId?: string) {
    await this.requireUser(id);
    await this.db.update(users).set({ displayName: input.displayName?.trim(), email: input.email?.trim() || null, status: input.status, updatedAt: new Date() }).where(eq(users.id, id));
    if (input.status === 'disabled') await this.db.delete(sessions).where(eq(sessions.userId, id));
    await this.audit.record({ userId: actorId, action: 'admin.user_updated', resource: 'user', resourceId: id, metadata: { fields: Object.keys(input) } });
    return { ok: true };
  }

  async resetPassword(id: string, password: string, actorId?: string) {
    if (password.length < 10 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) throw new BadRequestException('新密码至少 10 位且必须包含字母和数字');
    await this.requireUser(id);
    await this.db.update(users).set({ passwordHash: await hashPassword(password), mustChangePassword: true, updatedAt: new Date() }).where(eq(users.id, id));
    await this.db.delete(sessions).where(eq(sessions.userId, id));
    await this.audit.record({ userId: actorId, action: 'admin.password_reset', resource: 'user', resourceId: id });
    return { ok: true };
  }

  async assignRoles(id: string, roleKeys: string[], actorId?: string) {
    await this.requireUser(id);
    const selected = await this.db.select({ id: roles.id, roleKey: roles.roleKey }).from(roles).where(inArray(roles.roleKey, roleKeys));
    await this.db.transaction(async (tx) => {
      await tx.delete(userRoles).where(eq(userRoles.userId, id));
      if (selected.length) await tx.insert(userRoles).values(selected.map((role) => ({ userId: id, roleId: role.id }))).onConflictDoNothing();
    });
    await this.audit.record({ userId: actorId, action: 'admin.roles_assigned', resource: 'user', resourceId: id, metadata: { roleKeys } });
    return { ok: true };
  }

  private async requireUser(id: string) {
    const [user] = await this.db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
    if (!user) throw new NotFoundException('用户不存在');
    return user;
  }
}
