import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, ilike, inArray, or } from 'drizzle-orm';

import { INDEPENDENT_DATABASE, type IndependentDatabase } from '@server/database/database.module';
import { users } from '@server/database/independent-schema';

interface DirectoryUser {
  id: string;
  name: { zh_cn?: string; en_us?: string };
  avatar?: { image: { large: string } };
  email?: string;
}

/** Local replacement for the platform address-book lookup used by business services. */
@Injectable()
export class UserDirectoryService {
  constructor(@Inject(INDEPENDENT_DATABASE) private readonly db: IndependentDatabase) {}

  async listUsersByIds(userIds: string[]): Promise<Array<DirectoryUser | null>> {
    if (userIds.length === 0) return [];
    const rows = await this.db
      .select({ id: users.id, displayName: users.displayName, avatarUrl: users.avatarUrl, email: users.email })
      .from(users)
      .where(inArray(users.id, userIds));
    const byId = new Map(rows.map((row) => [row.id, row]));
    return userIds.map((id) => {
      const user = byId.get(id);
      if (!user) return null;
      return {
        id: user.id,
        name: { zh_cn: user.displayName },
        avatar: user.avatarUrl ? { image: { large: user.avatarUrl } } : undefined,
        email: user.email ?? undefined,
      };
    });
  }

  async findByIds(userIds: string[]) {
    const uniqueIds = [...new Set(userIds)].slice(0, 100);
    const rows = await this.db
      .select({ id: users.id, displayName: users.displayName, avatarUrl: users.avatarUrl, email: users.email })
      .from(users)
      .where(and(eq(users.status, 'active'), inArray(users.id, uniqueIds)));
    const byId = new Map(rows.map((row) => [row.id, row]));
    const items = uniqueIds.flatMap((id) => {
      const user = byId.get(id);
      return user ? [user] : [];
    });
    return { items, total: items.length, page: 1, pageSize: items.length };
  }

  async search(query = '', page = 1, pageSize = 20) {
    const normalized = query.trim();
    const safePageSize = Math.min(Math.max(pageSize, 1), 100);
    const safePage = Math.max(page, 1);
    const rows = await this.db
      .select({ id: users.id, displayName: users.displayName, avatarUrl: users.avatarUrl, email: users.email })
      .from(users)
      .where(normalized
        ? and(eq(users.status, 'active'), or(ilike(users.displayName, `%${normalized}%`), ilike(users.username, `%${normalized}%`), ilike(users.email, `%${normalized}%`)))
        : eq(users.status, 'active'))
      .orderBy(asc(users.displayName));
    const activeRows = rows.filter((row) => row.id && row.displayName);
    const start = (safePage - 1) * safePageSize;
    return {
      items: activeRows.slice(start, start + safePageSize),
      total: activeRows.length,
      page: safePage,
      pageSize: safePageSize,
    };
  }
}
