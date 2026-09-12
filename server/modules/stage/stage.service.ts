import { and, asc, desc, eq, ne } from 'drizzle-orm';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/database/database.module';
import { challengeTask, stageCatalog } from '@server/database/schema';
import type { StageCatalogItem } from '@shared/stage';

/** 新增阶段请求 */
export interface CreateStageDto {
  code: string;
  name: string;
  startDay: number;
  endDay: number;
  standard?: string;
  hasDefense?: boolean;
}

/** 更新阶段请求 */
export interface UpdateStageDto {
  code?: string;
  name?: string;
  startDay?: number;
  endDay?: number;
  standard?: string;
  hasDefense?: boolean;
}

/** 阶段下拉选项 */
export interface StageOption {
  value: string;
  label: string;
}

@Injectable()
export class StageService {
  private readonly logger = new Logger(StageService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  /** 获取全部阶段（按 sort 升序） */
  async list(): Promise<StageCatalogItem[]> {
    const rows = await this.db
      .select()
      .from(stageCatalog)
      .orderBy(asc(stageCatalog.sort));
    return rows.map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      sort: row.sort,
      startDay: row.startDay,
      endDay: row.endDay,
      standard: row.standard ?? '',
      hasDefense: row.hasDefense,
    }));
  }

  /** 获取阶段下拉选项 */
  async getOptions(): Promise<StageOption[]> {
    const rows = await this.db
      .select({
        code: stageCatalog.code,
        name: stageCatalog.name,
        sort: stageCatalog.sort,
      })
      .from(stageCatalog)
      .orderBy(asc(stageCatalog.sort));
    return rows.map((row) => ({
      value: row.code,
      label: row.name,
    }));
  }

  /** 新增阶段 */
  async create(dto: CreateStageDto): Promise<{ id: string }> {
    const code = dto.code?.trim() ?? '';
    const name = dto.name?.trim() ?? '';
    const standard = dto.standard?.trim() ?? '';

    if (!code) throw new BadRequestException('阶段编码不能为空');
    if (!name) throw new BadRequestException('阶段名称不能为空');
    if (!Number.isInteger(dto.startDay) || dto.startDay < 1) {
      throw new BadRequestException('起始天数需为正整数');
    }
    if (!Number.isInteger(dto.endDay) || dto.endDay < dto.startDay) {
      throw new BadRequestException('截止天数需 ≥ 起始天数');
    }

    // 检查编码唯一性
    const existing = await this.db
      .select({ id: stageCatalog.id })
      .from(stageCatalog)
      .where(eq(stageCatalog.code, code))
      .limit(1);
    if (existing.length > 0) {
      throw new ConflictException('阶段编码已存在');
    }

    // 自动递增 sort
    const maxSortRows = await this.db
      .select({ maxSort: stageCatalog.sort })
      .from(stageCatalog)
      .orderBy(desc(stageCatalog.sort))
      .limit(1);
    const nextSort = (maxSortRows[0]?.maxSort ?? 0) + 1;

    const [created] = await this.db
      .insert(stageCatalog)
      .values({
        code,
        name,
        startDay: dto.startDay,
        endDay: dto.endDay,
        standard,
        hasDefense: dto.hasDefense ?? false,
        sort: nextSort,
      })
      .returning({ id: stageCatalog.id });

    return { id: created.id };
  }

  /** 更新阶段 */
  async update(id: string, dto: UpdateStageDto): Promise<void> {
    const patch: Partial<typeof stageCatalog.$inferInsert> = {};

    if (dto.code !== undefined) {
      const code: string = dto.code.trim();
      if (!code) throw new BadRequestException('阶段编码不能为空');
      // 检查编码唯一性（排除自身）
      const existing = await this.db
        .select({ id: stageCatalog.id })
        .from(stageCatalog)
        .where(and(eq(stageCatalog.code, code), ne(stageCatalog.id, id)))
        .limit(1);
      if (existing.length > 0) {
        throw new ConflictException('阶段编码已被其他阶段使用');
      }
      patch.code = code;
    }

    if (dto.name !== undefined) {
      const name: string = dto.name.trim();
      if (!name) throw new BadRequestException('阶段名称不能为空');
      patch.name = name;
    }

    if (dto.startDay !== undefined) {
      if (!Number.isInteger(dto.startDay) || dto.startDay < 1) {
        throw new BadRequestException('起始天数需为正整数');
      }
      patch.startDay = dto.startDay;
    }

    if (dto.endDay !== undefined) {
      if (!Number.isInteger(dto.endDay) || dto.endDay < 1) {
        throw new BadRequestException('截止天数需为正整数');
      }
      patch.endDay = dto.endDay;
    }

    if (dto.standard !== undefined) {
      patch.standard = dto.standard.trim();
    }

    if (dto.hasDefense !== undefined) {
      patch.hasDefense = dto.hasDefense;
    }

    // 校验 startDay ≤ endDay
    if (dto.startDay !== undefined && dto.endDay !== undefined) {
      if (dto.endDay < dto.startDay) {
        throw new BadRequestException('截止天数不能小于起始天数');
      }
    }

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    const updated = await this.db
      .update(stageCatalog)
      .set(patch)
      .where(eq(stageCatalog.id, id))
      .returning({ id: stageCatalog.id });
    if (updated.length === 0) throw new NotFoundException('阶段不存在');
  }

  /** 删除阶段（检查无闯关任务引用） */
  async delete(id: string): Promise<void> {
    const stage = await this.db
      .select({ code: stageCatalog.code })
      .from(stageCatalog)
      .where(eq(stageCatalog.id, id))
      .limit(1);
    if (stage.length === 0) throw new NotFoundException('阶段不存在');

    // 检查是否有闯关任务引用此阶段编码
    const referencingTasks = await this.db
      .select({ id: challengeTask.id })
      .from(challengeTask)
      .where(eq(challengeTask.stage, stage[0].code))
      .limit(1);
    if (referencingTasks.length > 0) {
      throw new ConflictException('该阶段下存在闯关任务，无法删除');
    }

    const deleted = await this.db
      .delete(stageCatalog)
      .where(eq(stageCatalog.id, id))
      .returning({ id: stageCatalog.id });
    if (deleted.length === 0) throw new NotFoundException('阶段不存在');
  }

  /** 加载全部阶段（供其他模块复用） */
  async loadStages(): Promise<StageCatalogItem[]> {
    return this.list();
  }
}
