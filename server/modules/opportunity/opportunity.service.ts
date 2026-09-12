import { desc, eq } from 'drizzle-orm';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/database/database.module';
import { newcomer, opportunity } from '@server/database/schema';
import type {
  CreateOpportunitySelfRequest,
  OpportunityItem,
  OpportunitySelfSummaryResponse,
  RecordMaterial,
} from '@shared/api.interface';

const STAGE_TO_DB: Record<string, string> = {
  初步接触: 'initial',
  需求确认: 'requirement',
  方案报价: 'proposal',
  商务谈判: 'negotiation',
  赢单: 'won',
  输单: 'loss',
};

const STAGE_TO_API: Record<string, string> = {
  initial: '初步接触',
  requirement: '需求确认',
  proposal: '方案报价',
  negotiation: '商务谈判',
  won: '赢单',
  loss: '输单',
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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

@Injectable()
export class OpportunityService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  /** 新人自助上传商机 */
  async createOpportunitySelf(
    body: CreateOpportunitySelfRequest,
    userId: string,
  ): Promise<{ id: string }> {
    const name = body.name?.trim() ?? '';
    const customer = body.customer?.trim() ?? '';
    const dbStage = body.stage ? STAGE_TO_DB[body.stage] : undefined;
    if (!name) throw new BadRequestException('请填写商机名称');
    if (!customer) throw new BadRequestException('请填写客户名称');
    if (!dbStage) throw new BadRequestException('销售阶段不合法');
    if (typeof body.amount !== 'number' || !Number.isFinite(body.amount) || body.amount < 0) {
      throw new BadRequestException('预计金额需为非负数字');
    }
    if (!DATE_PATTERN.test(body.recordDate)) {
      throw new BadRequestException('请选择记录日期');
    }
    if (body.expectedDate && !DATE_PATTERN.test(body.expectedDate)) {
      throw new BadRequestException('预计成交日期格式不合法');
    }

    const rows = await this.db
      .select({ id: newcomer.id })
      .from(newcomer)
      .where(eq(newcomer.userId, userId))
      .limit(1);
    const profile = rows[0];
    if (!profile) {
      throw new NotFoundException('未找到当前用户的新人档案，请先在工作台导入');
    }

    const inserted = await this.db
      .insert(opportunity)
      .values({
        newcomerId: profile.id,
        name,
        customer,
        amount: String(body.amount),
        stage: dbStage,
        recordDate: body.recordDate,
        expectedDate: body.expectedDate ?? null,
        remark: body.remark?.trim() ? body.remark.trim() : null,
        materials: serializeMaterials(body.materials),
      })
      .returning({ id: opportunity.id });

    return { id: inserted[0].id };
  }

  /** 当前用户的商机摘要：总数 + 最近 5 条 */
  async getOpportunitySelfSummary(
    userId: string,
  ): Promise<OpportunitySelfSummaryResponse> {
    const rows = await this.db
      .select({ id: newcomer.id })
      .from(newcomer)
      .where(eq(newcomer.userId, userId))
      .limit(1);
    const profile = rows[0];
    if (!profile) {
      return { count: 0, items: [] };
    }

    const list = await this.db
      .select()
      .from(opportunity)
      .where(eq(opportunity.newcomerId, profile.id))
      .orderBy(desc(opportunity.recordDate), desc(opportunity.createdAt))
      .limit(5);

    const items: OpportunityItem[] = list.map((row) => ({
      id: row.id,
      name: row.name,
      customer: row.customer,
      amount: Number(row.amount ?? 0),
      stage: STAGE_TO_API[row.stage] ?? row.stage,
      recordDate: row.recordDate,
      expectedDate: row.expectedDate,
      remark: row.remark ?? '',
    }));

    const countRows = await this.db
      .select({ id: opportunity.id })
      .from(opportunity)
      .where(eq(opportunity.newcomerId, profile.id));

    return { count: countRows.length, items };
  }
}
