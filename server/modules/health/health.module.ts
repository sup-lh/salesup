import { Controller, Get, Module, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Inject } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { INDEPENDENT_DATABASE, type IndependentDatabase } from '@server/database/database.module';
import { StorageService } from '@server/modules/storage/storage.service';

@Controller('api/health')
export class HealthController {
  constructor(
    @Inject(INDEPENDENT_DATABASE) private readonly db: IndependentDatabase,
    private readonly storage: StorageService,
  ) {}

  @Get('live')
  live() { return { status: 'ok' as const }; }

  @Get('ready')
  async ready(@Res({ passthrough: true }) response: Response) {
    const checks = { database: 'unavailable', storage: 'unavailable' };
    try { await this.db.execute(sql`select 1`); checks.database = 'ok'; } catch { /* reported below */ }
    try { if (await this.storage.isReady()) checks.storage = 'ok'; } catch { /* reported below */ }
    const ready = checks.database === 'ok' && checks.storage === 'ok';
    if (!ready) response.status(503);
    return { status: ready ? 'ok' : 'degraded', checks };
  }
}

@Module({ controllers: [HealthController] })
export class HealthModule {}
