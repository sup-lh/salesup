import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, isNull } from 'drizzle-orm';

import { INDEPENDENT_DATABASE, type IndependentDatabase } from '@server/database/database.module';
import { notifications, roles, userRoles, users } from '@server/database/independent-schema';

export interface CreateNotificationInput {
  userId: string;
  title: string;
  body: string;
  type?: string;
  link?: string;
}

@Injectable()
export class NotificationService {
  constructor(@Inject(INDEPENDENT_DATABASE) private readonly db: IndependentDatabase) {}

  async create(input: CreateNotificationInput) {
    const [created] = await this.db.insert(notifications).values(input).returning();
    return created;
  }

  async listForUser(userId: string, unreadOnly = false) {
    return this.db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), unreadOnly ? isNull(notifications.readAt) : undefined))
      .orderBy(desc(notifications.createdAt));
  }

  async markRead(userId: string, notificationId: string) {
    const [updated] = await this.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
      .returning({ id: notifications.id });
    if (!updated) throw new NotFoundException('通知不存在');
    return updated;
  }

  async markAllRead(userId: string) {
    await this.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
    return { ok: true };
  }

  async notifyRole(roleKey: string, input: Omit<CreateNotificationInput, 'userId'>) {
    const recipients = await this.db
      .select({ userId: userRoles.userId })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .innerJoin(users, eq(userRoles.userId, users.id))
      .where(and(eq(roles.roleKey, roleKey), eq(users.status, 'active')));
    if (recipients.length === 0) return [];
    return Promise.all(recipients.map(({ userId }) => this.create({ ...input, userId })));
  }
}
