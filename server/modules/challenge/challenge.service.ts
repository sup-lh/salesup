import { and, asc, desc, eq, isNotNull, isNull } from 'drizzle-orm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/database/database.module';
import { challengeTask, newcomer, stageCatalog, taskRecord } from '@server/database/schema';
import { resolveGrowthStage } from '@shared/common';
import type { GrowthStage } from '@shared/common';
import type { StageCatalogItem } from '@shared/stage';
import type {
  ChallengeFilter,
  ChallengeRecordsResponse,
  ChallengeStageGroup,
  ChallengeTaskItem,
  ChallengeTaskListResponse,
  ChallengeTaskTemplate,
  CreateChallengeTaskRequest,
  TaskCancelCheckinResponse,
  TaskCheckinResponse,
  UpdateChallengeTaskRequest,
} from '@shared/api.interface';


const VALID_FILTERS: ChallengeFilter[] = ['today', 'pending', 'done'];

const NEWCOMER_NOT_FOUND_MESSAGE =
  '未找到当前用户的新人档案，请联系管理员在新人管理中录入并关联账号';

interface CurrentNewcomer {
  id: string;
  hireDate: string;
}

interface JoinedTaskRow {
  recordId: string;
  taskId: string;
  stage: string;
  title: string;
  category: string;
  standard: string;
  dueDay: number;
  unlockNextStage: boolean;
  completedAt: Date | null;
}

@Injectable()
export class ChallengeService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getChallengeRecords(
    userId: string,
    filter?: string,
    newcomerId?: string,
  ): Promise<ChallengeRecordsResponse> {
    const current =
      newcomerId !== undefined
        ? await this.findNewcomerById(newcomerId)
        : await this.findCurrentNewcomer(userId);
    if (!current) {
      if (newcomerId !== undefined) {
        throw new NotFoundException('未找到该新人的档案');
      }
      return { hasProfile: false, stages: [] };
    }
    const normalizedFilter = this.normalizeFilter(filter);
    const { dayCount } = resolveGrowthStage(current.hireDate);

    const rows: JoinedTaskRow[] = await this.loadTaskRows(current.id);

    const dbStages: StageCatalogItem[] = await this.loadStages();

    const stageRowsByIndex: JoinedTaskRow[][] = dbStages.map(
      (dbStage: StageCatalogItem) =>
        rows.filter(
          (row: JoinedTaskRow) => row.stage === dbStage.code,
        ),
    );
    /** 阶段解锁：到达起始天数，或上一阶段全部解锁任务完成（链式传播） */
    const unlockedFlags: boolean[] = [];
    stageRowsByIndex.forEach(
      (stageRows: JoinedTaskRow[], index: number): void => {
        if (dayCount >= dbStages[index].startDay) {
          unlockedFlags.push(true);
          return;
        }
        if (index === 0) {
          unlockedFlags.push(false);
          return;
        }
        const prevUnlockTasks = stageRowsByIndex[index - 1].filter(
          (row: JoinedTaskRow) => row.unlockNextStage,
        );
        unlockedFlags.push(
          unlockedFlags[index - 1] &&
            prevUnlockTasks.length > 0 &&
            prevUnlockTasks.every(
              (row: JoinedTaskRow) => row.completedAt !== null,
            ),
        );
      },
    );

    const stages: ChallengeStageGroup[] = dbStages.map(
      (dbStage: StageCatalogItem, index: number): ChallengeStageGroup => {
        const stageRows = stageRowsByIndex[index];
        const total = stageRows.length;
        const completedCount = stageRows.filter(
          (row: JoinedTaskRow) => row.completedAt !== null,
        ).length;
        const progress =
          total > 0 ? Math.floor((completedCount / total) * 100) : 0;

        const filteredRows = this.applyFilter(
          stageRows,
          normalizedFilter,
          dayCount,
        );

        return {
          stage: dbStage.name as GrowthStage,
          standard: dbStage.standard,
          progress,
          unlocked: unlockedFlags[index],
          unlockCondition: this.buildUnlockCondition(index, stageRowsByIndex, dbStages),
          tasks: filteredRows.map((row: JoinedTaskRow) =>
            this.toTaskItem(row),
          ),
        };
      },
    );

    return { hasProfile: true, stages };
  }

  async getTaskTemplates(): Promise<ChallengeTaskListResponse> {
    const rows = await this.db
      .select()
      .from(challengeTask)
      .orderBy(asc(challengeTask.dueDay), asc(challengeTask.sort));
    const items: ChallengeTaskTemplate[] = rows.map((row) => ({
      id: row.id,
      stage: row.stage,
      title: row.title,
      category: row.category,
      standard: row.standard,
      dueDay: row.dueDay,
      unlockNextStage: row.unlockNextStage,
      sort: row.sort,
    }));
    return { items };
  }

  /** 校验任务模板字段，返回规范化后的写入值 */
  private async validateTaskPayload(
    dto: UpdateChallengeTaskRequest,
  ): Promise<{
    stage: string;
    title: string;
    category: string;
    standard: string;
    dueDay: number;
    unlockNextStage: boolean;
  }> {
    const title = dto.title?.trim() ?? '';
    const category = dto.category?.trim() ?? '';
    const standard = dto.standard?.trim() ?? '';

    if (!title) throw new BadRequestException('任务标题不能为空');
    if (!category) throw new BadRequestException('任务类别不能为空');
    if (!standard) throw new BadRequestException('达标标准不能为空');
    const validStages: StageCatalogItem[] = await this.loadStages();
    const validCodes: string[] = validStages.map((s: StageCatalogItem) => s.code);
    if (!validCodes.includes(dto.stage)) {
      throw new BadRequestException('阶段不合法');
    }
    if (
      !Number.isInteger(dto.dueDay) ||
      dto.dueDay < 1 ||
      dto.dueDay > 90
    ) {
      throw new BadRequestException('截止天数需为 1-90 的整数');
    }
    return {
      stage: dto.stage,
      title,
      category,
      standard,
      dueDay: dto.dueDay,
      unlockNextStage: dto.unlockNextStage === true,
    };
  }

  /** 新增任务模板，并为存量新人补建打卡记录，保证闯关地图可见 */
  async createTaskTemplate(
    dto: CreateChallengeTaskRequest,
  ): Promise<{ id: string }> {
    const payload = await this.validateTaskPayload(dto);

    const stageRows = await this.db
      .select({ maxSort: challengeTask.sort })
      .from(challengeTask)
      .where(eq(challengeTask.stage, payload.stage))
      .orderBy(desc(challengeTask.sort))
      .limit(1);
    const nextSort = (stageRows[0]?.maxSort ?? 0) + 1;

    return this.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(challengeTask)
        .values({ ...payload, sort: nextSort })
        .returning({ id: challengeTask.id });

      const newcomers = await tx.select({ id: newcomer.id }).from(newcomer);
      if (newcomers.length > 0) {
        await tx
          .insert(taskRecord)
          .values(
            newcomers.map((row: { id: string }) => ({
              newcomerId: row.id,
              taskId: created.id,
            })),
          );
      }
      return { id: created.id };
    });
  }

  async updateTaskTemplate(
    taskId: string,
    dto: UpdateChallengeTaskRequest,
  ): Promise<void> {
    const payload = await this.validateTaskPayload(dto);

    const updated = await this.db
      .update(challengeTask)
      .set(payload)
      .where(eq(challengeTask.id, taskId))
      .returning({ id: challengeTask.id });
    if (updated.length === 0) throw new NotFoundException('任务不存在');
  }

  async deleteTaskTemplate(taskId: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .delete(taskRecord)
        .where(eq(taskRecord.taskId, taskId));

      const deleted = await tx
        .delete(challengeTask)
        .where(eq(challengeTask.id, taskId))
        .returning({ id: challengeTask.id });
      if (deleted.length === 0) throw new NotFoundException('任务不存在');
    });
  }

  async checkinTask(
    userId: string,
    recordId: string,
  ): Promise<TaskCheckinResponse> {
    if (typeof recordId !== 'string' || recordId.length === 0) {
      throw new BadRequestException('缺少打卡记录 ID');
    }
    const current = await this.findCurrentNewcomer(userId);
    if (!current) throw new NotFoundException(NEWCOMER_NOT_FOUND_MESSAGE);

    const existing = await this.db
      .select({
        id: taskRecord.id,
        newcomerId: taskRecord.newcomerId,
        completedAt: taskRecord.completedAt,
      })
      .from(taskRecord)
      .where(eq(taskRecord.id, recordId))
      .limit(1);

    if (existing.length === 0) {
      throw new NotFoundException('打卡记录不存在');
    }
    if (existing[0].newcomerId !== current.id) {
      throw new ForbiddenException('无权操作其他新人的任务记录');
    }
    if (existing[0].completedAt !== null) {
      throw new ConflictException('该任务已完成打卡');
    }

    const updated = await this.db
      .update(taskRecord)
      .set({ completedAt: new Date() })
      .where(
        and(eq(taskRecord.id, recordId), isNull(taskRecord.completedAt)),
      )
      .returning({ id: taskRecord.id, completedAt: taskRecord.completedAt });

    if (updated.length === 0 || updated[0].completedAt === null) {
      throw new ConflictException('该任务已完成打卡');
    }

    return {
      id: updated[0].id,
      completedAt: updated[0].completedAt.toISOString(),
    };
  }

  async uncheckinTask(
    userId: string,
    recordId: string,
  ): Promise<TaskCancelCheckinResponse> {
    if (typeof recordId !== 'string' || recordId.length === 0) {
      throw new BadRequestException('缺少打卡记录 ID');
    }
    const current = await this.findCurrentNewcomer(userId);
    if (!current) throw new NotFoundException(NEWCOMER_NOT_FOUND_MESSAGE);

    const existing = await this.db
      .select({
        id: taskRecord.id,
        newcomerId: taskRecord.newcomerId,
        completedAt: taskRecord.completedAt,
      })
      .from(taskRecord)
      .where(eq(taskRecord.id, recordId))
      .limit(1);

    if (existing.length === 0) {
      throw new NotFoundException('打卡记录不存在');
    }
    if (existing[0].newcomerId !== current.id) {
      throw new ForbiddenException('无权操作其他新人的任务记录');
    }
    if (existing[0].completedAt === null) {
      throw new ConflictException('该任务尚未完成打卡');
    }

    const updated = await this.db
      .update(taskRecord)
      .set({ completedAt: null })
      .where(
        and(
          eq(taskRecord.id, recordId),
          isNotNull(taskRecord.completedAt),
        ),
      )
      .returning({ id: taskRecord.id });

    if (updated.length === 0) {
      throw new ConflictException('该任务尚未完成打卡');
    }

    return { id: updated[0].id };
  }

  private normalizeFilter(filter?: string): ChallengeFilter | undefined {
    if (!filter) return undefined;
    return VALID_FILTERS.includes(filter as ChallengeFilter)
      ? (filter as ChallengeFilter)
      : undefined;
  }

  private applyFilter(
    rows: JoinedTaskRow[],
    filter: ChallengeFilter | undefined,
    dayCount: number,
  ): JoinedTaskRow[] {
    if (filter === 'today') {
      return rows.filter(
        (row: JoinedTaskRow) =>
          row.completedAt === null && row.dueDay <= dayCount + 3,
      );
    }
    if (filter === 'pending') {
      return rows.filter((row: JoinedTaskRow) => row.completedAt === null);
    }
    if (filter === 'done') {
      return rows.filter((row: JoinedTaskRow) => row.completedAt !== null);
    }
    return rows;
  }

  private buildUnlockCondition(
    index: number,
    stageRowsByIndex: JoinedTaskRow[][],
    dbStages: StageCatalogItem[],
  ): string {
    if (index === 0) return '入职即自动解锁';
    const prevStage = dbStages[index - 1];
    const prevUnlockTasks = stageRowsByIndex[index - 1].filter(
      (row: JoinedTaskRow) => row.unlockNextStage,
    );
    if (prevUnlockTasks.length > 0) {
      return `完成${prevStage.name}全部 ${prevUnlockTasks.length} 项解锁任务即可提前解锁本阶段`;
    }
    return `完成${prevStage.name}通关标准：${prevStage.standard}`;
  }

  private toTaskItem(row: JoinedTaskRow): ChallengeTaskItem {
    return {
      recordId: row.recordId,
      taskId: row.taskId,
      title: row.title,
      category: row.category,
      standard: row.standard,
      dueDay: row.dueDay,
      unlockNextStage: row.unlockNextStage,
      completed: row.completedAt !== null,
      completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    };
  }

  private async loadTaskRows(newcomerId: string): Promise<JoinedTaskRow[]> {
    return this.db
      .select({
        recordId: taskRecord.id,
        taskId: challengeTask.id,
        stage: challengeTask.stage,
        title: challengeTask.title,
        category: challengeTask.category,
        standard: challengeTask.standard,
        dueDay: challengeTask.dueDay,
        unlockNextStage: challengeTask.unlockNextStage,
        completedAt: taskRecord.completedAt,
      })
      .from(taskRecord)
      .innerJoin(challengeTask, eq(taskRecord.taskId, challengeTask.id))
      .where(eq(taskRecord.newcomerId, newcomerId))
      .orderBy(asc(challengeTask.dueDay), asc(challengeTask.sort));
  }

  private async findNewcomerById(
    newcomerId: string,
  ): Promise<CurrentNewcomer | null> {
    const rows = await this.db
      .select({ id: newcomer.id, hireDate: newcomer.hireDate })
      .from(newcomer)
      .where(eq(newcomer.id, newcomerId))
      .limit(1);

    return rows[0] ?? null;
  }

  private async findCurrentNewcomer(
    userId: string,
  ): Promise<CurrentNewcomer | null> {
    const rows = await this.db
      .select({ id: newcomer.id, hireDate: newcomer.hireDate })
      .from(newcomer)
      .where(eq(newcomer.userId, userId))
      .limit(1);

    return rows[0] ?? null;
  }

  /** 从数据库加载全部阶段（按 sort 升序） */
  private async loadStages(): Promise<StageCatalogItem[]> {
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
}
