import { Inject, Injectable, Logger } from '@nestjs/common';
import { desc } from 'drizzle-orm';

import { INDEPENDENT_DATABASE, type IndependentDatabase } from '@server/database/database.module';
import { auditLog } from '@server/database/independent-schema';

export interface AuditEvent {
  userId?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(@Inject(INDEPENDENT_DATABASE) private readonly db: IndependentDatabase) {}

  async record(event: AuditEvent): Promise<void> {
    try {
      await this.db.insert(auditLog).values({
        userId: event.userId,
        action: event.action,
        resource: event.resource,
        resourceId: event.resourceId,
        metadata: event.metadata,
      });
    } catch (error) {
      this.logger.error(`Audit write failed for ${event.action}`, error instanceof Error ? error.stack : String(error));
    }
  }

  list(limit = 100) {
    const safeLimit = Math.min(Math.max(limit, 1), 500);
    return this.db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(safeLimit);
  }
}
