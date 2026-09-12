import { createHmac, randomBytes } from 'node:crypto';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, eq, gt, ne } from 'drizzle-orm';

import { INDEPENDENT_DATABASE, type IndependentDatabase } from '@server/database/database.module';
import { sessions, users } from '@server/database/independent-schema';
import { AUTH_SESSION_DAYS } from '@server/common/auth/auth.constants';
import type { UserContext } from '@server/common/auth/auth.types';
import { hashPassword, verifyPassword } from '@server/common/auth/password';
import { PermissionService } from './permission.service';
import { AuditService } from './audit.service';
import { getSessionSecret } from '@server/config/environment';

export function hashSessionToken(token: string, secret: string): string {
  return createHmac('sha256', secret).update(token).digest('hex');
}

@Injectable()
export class AuthService {
  private readonly sessionSecret: string;

  constructor(
    @Inject(INDEPENDENT_DATABASE) private readonly db: IndependentDatabase,
    private readonly permissionService: PermissionService,
    private readonly audit: AuditService,
    config: ConfigService,
  ) {
    this.sessionSecret = getSessionSecret(config);
  }

  async login(username: string, password: string): Promise<{ token: string; user: UserContext }> {
    const rows = await this.db
      .select()
      .from(users)
      .where(and(eq(users.username, username.trim()), eq(users.status, 'active')))
      .limit(1);
    const user = rows[0];
    if (user?.lockedUntil && user.lockedUntil > new Date()) {
      await this.audit.record({ userId: user.id, action: 'auth.login_denied', resource: 'session', metadata: { reason: 'locked' } });
      throw new UnauthorizedException('账号暂时锁定，请稍后重试');
    }
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      if (user) {
        const attempts = Number(user.failedLoginCount) + 1;
        await this.db.update(users).set({ failedLoginCount: attempts, lockedUntil: attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null }).where(eq(users.id, user.id));
      }
      await this.audit.record({ userId: user?.id, action: 'auth.login_failed', resource: 'session', metadata: { username: username.trim() } });
      throw new UnauthorizedException('用户名或密码错误');
    }

    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + AUTH_SESSION_DAYS * 24 * 60 * 60 * 1000);
    await this.db.insert(sessions).values({
      userId: user.id,
      tokenHash: hashSessionToken(token, this.sessionSecret),
      expiresAt,
    });
    await this.db.update(users).set({ failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() }).where(eq(users.id, user.id));

    const context = await this.toUserContext(user.id, user.username, user.displayName, user.mustChangePassword);
    await this.audit.record({ userId: user.id, action: 'auth.login', resource: 'session' });
    return { token, user: context };
  }

  async logout(token: string, userId?: string): Promise<void> {
    await this.db.delete(sessions).where(eq(sessions.tokenHash, hashSessionToken(token, this.sessionSecret)));
    await this.audit.record({ userId, action: 'auth.logout', resource: 'session' });
  }

  async resolveSession(token: string): Promise<UserContext | undefined> {
    const rows = await this.db
      .select({
        sessionId: sessions.id,
        userId: users.id,
        username: users.username,
        displayName: users.displayName,
        mustChangePassword: users.mustChangePassword,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(and(eq(sessions.tokenHash, hashSessionToken(token, this.sessionSecret)), gt(sessions.expiresAt, new Date()), eq(users.status, 'active')))
      .limit(1);
    const row = rows[0];
    if (!row) return undefined;
    await this.db.update(sessions).set({ lastSeenAt: new Date() }).where(eq(sessions.id, row.sessionId));
    return this.toUserContext(row.userId, row.username, row.displayName, row.mustChangePassword);
  }

  async createUser(input: {
    username: string;
    password: string;
    displayName: string;
    email?: string;
  }): Promise<{ id: string }> {
    const [created] = await this.db
      .insert(users)
      .values({
        username: input.username.trim(),
        passwordHash: await hashPassword(input.password),
        displayName: input.displayName.trim(),
        email: input.email?.trim() || null,
      })
      .returning({ id: users.id });
    return created;
  }

  async changePassword(
    userId: string,
    currentPassword: string | undefined,
    newPassword: string,
    currentToken?: string,
  ) {
    const [user] = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new UnauthorizedException('用户不存在');
    if (currentPassword && !(await verifyPassword(currentPassword, user.passwordHash))) throw new UnauthorizedException('当前密码错误');
    await this.db.update(users).set({ passwordHash: await hashPassword(newPassword), mustChangePassword: false, updatedAt: new Date() }).where(eq(users.id, userId));
    // Keep the active session used for the password change, while revoking
    // every other session for safety. The frontend can refresh immediately
    // without forcing the user through a second login.
    const tokenHash = currentToken ? hashSessionToken(currentToken, this.sessionSecret) : undefined;
    await this.db.delete(sessions).where(
      tokenHash
        ? and(eq(sessions.userId, userId), ne(sessions.tokenHash, tokenHash))
        : eq(sessions.userId, userId),
    );
    await this.audit.record({ userId, action: 'auth.password_changed', resource: 'user', resourceId: userId });
    return { ok: true };
  }

  private async toUserContext(userId: string, username: string, displayName: string, mustChangePassword = false): Promise<UserContext> {
    const [roleKeys, userPermissions] = await Promise.all([
      this.permissionService.listRoleKeys(userId),
      this.permissionService.listPermissions(userId),
    ]);
    return {
      userId,
      username,
      displayName,
      roleKeys,
      permissions: userPermissions,
      mustChangePassword,
    };
  }
}
