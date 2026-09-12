import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { and, asc, count, desc, eq, gte, inArray, lt } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/database/database.module';
import { UserDirectoryService } from '@server/modules/auth/user-directory.service';
import { coachingRecord, newcomer, reviewRecord } from '@server/database/schema';
import type {
  CoachingRecord,
  CreateCoachingRequest,
  CreateCoachingSelfRequest,
  CreateReviewRequest,
  RecordMaterial,
  ReviewRecord,
} from '@shared/api.interface';

/** 复盘记录（含首条赢单复盘标记，用于前端金色高亮置顶） */
export interface ReviewRecordItem extends ReviewRecord {
  isFirstWin?: boolean;
}

interface ListParams {
  type?: string;
  startDate?: string;
  endDate?: string;
  offset: number;
  pageSize: number;
}

const COACHING_TYPE_TO_DB: Record<string, string> = {
  陪访: 'visit',
  一对一辅导: '1on1',
  拜访: 'customer_visit',
  带教陪访: 'mentor_visit',
};

/** 带教记录写入 DTO：管理端与自助端共用的宽类型 */
type CoachingRecordWrite = Omit<CreateCoachingRequest, 'type'> & {
  type: '陪访' | '一对一辅导' | '拜访' | '带教陪访';
};

const COACHING_TYPE_TO_API: Record<string, string> = {
  visit: '陪访',
  '1on1': '一对一辅导',
  customer_visit: '拜访',
  mentor_visit: '带教陪访',
};

const REVIEW_TYPE_TO_DB: Record<string, string> = {
  赢单复盘: 'win',
  输单复盘: 'loss',
  案例分享: 'case',
};

const REVIEW_TYPE_TO_API: Record<string, string> = {
  win: '赢单复盘',
  loss: '输单复盘',
  case: '案例分享',
};

/** 计算下一天（UTC），用于 endDate 半开区间上界 */
function nextDay(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('日期格式无效');
  }
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

/** 校验并序列化材料列表，空/非法时返回 null */
function serializeMaterials(
  materials: RecordMaterial[] | undefined,
): string | null {
  if (!Array.isArray(materials) || materials.length === 0) return null;
  const normalized: RecordMaterial[] = materials.map((item) => ({
    name: String(item?.name ?? '').trim(),
    url: String(item?.url ?? '').trim(),
    source: item?.source === 'upload' ? 'upload' : 'external_link',
  }));
  for (const item of normalized) {
    if (!item.name || !/^https?:\/\//.test(item.url)) {
      throw new BadRequestException('材料名称与链接格式不合法');
    }
  }
  return JSON.stringify(normalized);
}

/** 安全反序列化材料列表 */
function parseMaterials(raw: string | null): RecordMaterial[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RecordMaterial[]) : [];
  } catch {
    return [];
  }
}

@Injectable()
export class CoachingReviewService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly directory: UserDirectoryService,
  ) {}

  /** 批量解析用户姓名，查不到或为空给「未知」 */
  private async resolveUserNames(
    userIds: string[],
  ): Promise<Map<string, string>> {
    const nameMap = new Map<string, string>();
    if (userIds.length === 0) return nameMap;
    const users = await this.directory.listUsersByIds(userIds);
    users.forEach((user, index) => {
      if (!user) return;
      const name = user.name?.zh_cn ?? user.name?.en_us ?? '未知';
      nameMap.set(userIds[index], name);
    });
    return nameMap;
  }

  private buildConditions(
    typeColumn: AnyPgColumn,
    dateColumn: AnyPgColumn,
    params: ListParams,
    typeToDb: Record<string, string>,
  ): SQL | undefined {
    const conditions: SQL[] = [];
    if (params.type) {
      const dbType = typeToDb[params.type];
      if (!dbType) {
        throw new BadRequestException('无效的记录类型');
      }
      conditions.push(eq(typeColumn, dbType));
    }
    if (params.startDate) {
      conditions.push(gte(dateColumn, params.startDate));
    }
    if (params.endDate) {
      conditions.push(lt(dateColumn, nextDay(params.endDate)));
    }
    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  async listCoachingRecords(
    params: ListParams,
  ): Promise<{ items: CoachingRecord[]; total: number }> {
    const where = this.buildConditions(
      coachingRecord.type,
      coachingRecord.recordDate,
      params,
      COACHING_TYPE_TO_DB,
    );

    const rows = await this.db
      .select()
      .from(coachingRecord)
      .where(where)
      .orderBy(desc(coachingRecord.recordDate), desc(coachingRecord.id))
      .limit(params.pageSize)
      .offset(params.offset);

    const totalRows = await this.db
      .select({ value: count() })
      .from(coachingRecord)
      .where(where);
    const total = Number(totalRows[0]?.value ?? 0);

    const coachIds = [
      ...new Set(
        rows
          .map((row) => row.coach)
          .filter((coachId): coachId is string => Boolean(coachId)),
      ),
    ];
    const nameMap = await this.resolveUserNames(coachIds);

    const items: CoachingRecord[] = rows.map((row) => ({
      id: row.id,
      type: (COACHING_TYPE_TO_API[row.type] ?? row.type) as CoachingRecord['type'],
      coachId: row.coach ?? null,
      coachName: row.coach ? nameMap.get(row.coach) ?? '未知' : '未知',
      recordDate: row.recordDate,
      durationHours: Number(row.durationHours ?? 0),
      content: row.content,
      improvement: row.improvement ?? '',
      materials: parseMaterials(row.materials),
    }));

    return { items, total };
  }

  async createCoachingRecord(
    body: CoachingRecordWrite,
    userId: string,
  ): Promise<{ id: string }> {
    const dbType = body.type ? COACHING_TYPE_TO_DB[body.type] : undefined;
    if (!dbType) {
      throw new BadRequestException('带教类型无效或缺失');
    }
    if (!body.newcomerId) {
      throw new BadRequestException('请选择关联新人');
    }
    if (!body.recordDate) {
      throw new BadRequestException('请选择记录日期');
    }
    if (!body.content || body.content.trim().length === 0) {
      throw new BadRequestException('请填写辅导要点');
    }

    const inserted = await this.db
      .insert(coachingRecord)
      .values({
        newcomerId: body.newcomerId,
        type: dbType,
        coach: userId,
        recordDate: body.recordDate,
        durationHours:
          body.durationHours !== undefined && body.durationHours !== null
            ? String(body.durationHours)
            : '0',
        content: body.content,
        improvement: body.improvement ?? null,
        materials: serializeMaterials(body.materials),
      })
      .returning({ id: coachingRecord.id });

    return { id: inserted[0].id };
  }

  /** 新人自助上传：按当前用户解析新人档案后复用常规创建逻辑 */
  async createCoachingSelfRecord(
    body: CreateCoachingSelfRequest,
    userId: string,
  ): Promise<{ id: string }> {
    const rows = await this.db
      .select({ id: newcomer.id })
      .from(newcomer)
      .where(eq(newcomer.userId, userId))
      .limit(1);
    const profile = rows[0];
    if (!profile) {
      throw new NotFoundException('未找到当前用户的新人档案，请先在工作台导入');
    }
    return this.createCoachingRecord(
      { ...body, newcomerId: profile.id },
      userId,
    );
  }

  async listReviewRecords(
    params: ListParams,
  ): Promise<{ items: ReviewRecordItem[]; total: number }> {
    const where = this.buildConditions(
      reviewRecord.type,
      reviewRecord.recordDate,
      params,
      REVIEW_TYPE_TO_DB,
    );

    const rows = await this.db
      .select()
      .from(reviewRecord)
      .where(where)
      .orderBy(desc(reviewRecord.recordDate), desc(reviewRecord.id))
      .limit(params.pageSize)
      .offset(params.offset);

    const totalRows = await this.db
      .select({ value: count() })
      .from(reviewRecord)
      .where(where);
    const total = Number(totalRows[0]?.value ?? 0);

    const sharerIds = [
      ...new Set(
        rows
          .map((row) => row.sharer)
          .filter((sharerId): sharerId is string => Boolean(sharerId)),
      ),
    ];
    const nameMap = await this.resolveUserNames(sharerIds);

    const firstWinIds = await this.findFirstWinIds(rows);

    const items: ReviewRecordItem[] = rows.map((row) => ({
      id: row.id,
      type: (REVIEW_TYPE_TO_API[row.type] ?? row.type) as ReviewRecord['type'],
      opportunity: row.opportunity,
      summary: row.summary,
      lessons: row.lessons,
      sharerId: row.sharer ?? null,
      sharerName: row.sharer ? nameMap.get(row.sharer) ?? '未知' : '未知',
      recordDate: row.recordDate,
      materials: parseMaterials(row.materials),
      isFirstWin: firstWinIds.has(row.id) || undefined,
    }));

    return { items, total };
  }

  /**
   * 找出当前页中属于「首条赢单复盘」的记录：
   * type=win 且 recordDate 在该新人 firstDealDate 之后最早的一条。
   */
  private async findFirstWinIds(
    rows: { id: string; newcomerId: string; type: string }[],
  ): Promise<Set<string>> {
    const result = new Set<string>();
    if (!rows.some((row) => row.type === 'win')) return result;

    const newcomerIds = [...new Set(rows.map((row) => row.newcomerId))];
    const newcomerRows = await this.db
      .select({ id: newcomer.id, firstDealDate: newcomer.firstDealDate })
      .from(newcomer)
      .where(inArray(newcomer.id, newcomerIds));

    const firstDealMap = new Map<string, string>();
    for (const row of newcomerRows) {
      if (row.firstDealDate) firstDealMap.set(row.id, row.firstDealDate);
    }
    if (firstDealMap.size === 0) return result;

    const winRows = await this.db
      .select({
        id: reviewRecord.id,
        newcomerId: reviewRecord.newcomerId,
        recordDate: reviewRecord.recordDate,
      })
      .from(reviewRecord)
      .where(
        and(
          eq(reviewRecord.type, 'win'),
          inArray(reviewRecord.newcomerId, [...firstDealMap.keys()]),
        ),
      )
      .orderBy(asc(reviewRecord.recordDate), asc(reviewRecord.id));

    // 每位新人首单之后最早的一条赢单复盘（按 recordDate、id 升序取第一条）
    const earliestWinIdByNewcomer = new Map<string, string>();
    for (const row of winRows) {
      const firstDealDate = firstDealMap.get(row.newcomerId);
      if (!firstDealDate || row.recordDate <= firstDealDate) continue;
      if (!earliestWinIdByNewcomer.has(row.newcomerId)) {
        earliestWinIdByNewcomer.set(row.newcomerId, row.id);
      }
    }
    for (const row of rows) {
      if (earliestWinIdByNewcomer.get(row.newcomerId) === row.id) {
        result.add(row.id);
      }
    }
    return result;
  }

  async createReviewRecord(
    body: CreateReviewRequest,
    userId: string,
  ): Promise<{ id: string }> {
    const dbType = body.type ? REVIEW_TYPE_TO_DB[body.type] : undefined;
    if (!dbType) {
      throw new BadRequestException('复盘类型无效或缺失');
    }
    if (!body.newcomerId) {
      throw new BadRequestException('请选择关联新人');
    }
    if (!body.opportunity || body.opportunity.trim().length === 0) {
      throw new BadRequestException('请填写关联客户/商机');
    }
    if (!body.lessons || body.lessons.trim().length === 0) {
      throw new BadRequestException('请填写经验教训');
    }
    if (!body.recordDate) {
      throw new BadRequestException('请选择记录日期');
    }

    const inserted = await this.db
      .insert(reviewRecord)
      .values({
        newcomerId: body.newcomerId,
        type: dbType,
        opportunity: body.opportunity,
        summary: body.summary ?? '',
        lessons: body.lessons,
        sharer: userId,
        recordDate: body.recordDate,
        materials: serializeMaterials(body.materials),
      })
      .returning({ id: reviewRecord.id });

    return { id: inserted[0].id };
  }
}
