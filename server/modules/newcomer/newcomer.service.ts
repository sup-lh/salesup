import {
  BadRequestException,
  ConflictException,
  Injectable,
  Inject,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/database/database.module';
import { UserDirectoryService } from '@server/modules/auth/user-directory.service';
import { and, count, desc, eq, ilike, inArray, isNotNull } from 'drizzle-orm';
import {
  assessmentRecord,
  challengeTask,
  coachingRecord,
  course,
  courseLearning,
  examResult,
  newcomer,
  reviewRecord,
  taskRecord,
} from '@server/database/schema';
import { GROWTH_STAGES, resolveGrowthStage, STAGE_DAY_RANGES, type GrowthStage } from '@shared/common';
import type {
  CreateAssessmentRequest,
  CreateNewcomerByUserRequest,
  CreateNewcomerRequest,
  DefenseOverviewItem,
  DefenseOverviewResponse,
  NewcomerChallengeTask,
  NewcomerDetail,
  NewcomerSummary,
  PassStatusItem,
  UpdateNewcomerRequest,
  AssessmentRecord,
} from '@shared/api.interface';

type NewcomerRow = typeof newcomer.$inferSelect;
type AssessmentRow = typeof assessmentRecord.$inferSelect;
type PositionCn = '销售顾问';
type StatusCn = '在培' | '已转正' | '已离职';
type NodeCn = '30天' | '60天' | '90天';
type ResultCn = '通过' | '待改进' | '不通过';

const POSITION_TO_DB: Record<PositionCn, string> = {
  销售顾问: 'sales_consultant',
};
const POSITION_FROM_DB: Record<string, PositionCn> = {
  sales_consultant: '销售顾问',
};
const STATUS_TO_DB: Record<StatusCn, string> = {
  在培: 'active',
  已转正: 'converted',
  已离职: 'left',
};
const STATUS_FROM_DB: Record<string, StatusCn> = {
  active: '在培',
  converted: '已转正',
  left: '已离职',
};
const NODE_TO_DB: Record<NodeCn, string> = { '30天': 'd30', '60天': 'd60', '90天': 'd90' };
const NODE_FROM_DB: Record<string, string> = { d30: '30天', d60: '60天', d90: '90天' };
const RESULT_TO_DB: Record<ResultCn, string> = { 通过: 'pass', 待改进: 'improve', 不通过: 'fail' };
const RESULT_FROM_DB: Record<string, string> = { pass: '通过', improve: '待改进', fail: '不通过' };

/** 通关映射：课程标题关键词 → 通关项 */
const PASS_GROUPS: Array<{
  key: string;
  label: string;
  match: (title: string) => boolean;
}> = [
  { key: 'product', label: '产品知识通关', match: (t) => t.includes('产品') || t.includes('行业') },
  { key: 'script', label: '话术通关', match: (t) => t.includes('话术') || t.includes('方法论') },
  { key: 'tools', label: '工具使用达标', match: (t) => t.includes('工具') || t.includes('流程') },
];

/** challenge_task.stage 数据库值 → 中文阶段（含中文原值直通，兜底按 dueDay 判断） */
const STAGE_FROM_DB: Record<string, GrowthStage> = {
  integration: '融入期',
  onboarding: '融入期',
  stage_1: '融入期',
  融入期: '融入期',
  practice: '实战期',
  combat: '实战期',
  stage_2: '实战期',
  实战期: '实战期',
  independent: '独立期',
  stage_3: '独立期',
  独立期: '独立期',
  consolidation: '巩固期',
  stage_4: '巩固期',
  巩固期: '巩固期',
};

function toStageLabel(raw: string, dueDay: number): GrowthStage {
  const mapped: GrowthStage | undefined = STAGE_FROM_DB[raw];
  if (mapped) return mapped;
  const range = STAGE_DAY_RANGES.find((r) => dueDay >= r.startDay && dueDay <= r.endDay);
  return range ? range.stage : '巩固期';
}

interface ExamRowLite {
  courseId: string;
  passed: boolean;
  takenAt: Date;
}

@Injectable()
export class NewcomerService {
  private readonly logger = new Logger(NewcomerService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly directory: UserDirectoryService,
  ) {}

  async listNewcomers(
    keyword?: string,
    stage?: string,
    assessmentStatus?: string,
    offset = 0,
    pageSize = 20,
  ): Promise<{ items: NewcomerSummary[]; total: number }> {
    const trimmed: string = (keyword ?? '').trim();
    const stageFilter: string = (stage ?? '').trim();
    const statusFilter: string = (assessmentStatus ?? '').trim();
    if (stageFilter && !GROWTH_STAGES.includes(stageFilter as GrowthStage)) {
      throw new BadRequestException('无效的阶段筛选');
    }
    if (statusFilter && statusFilter !== 'pending' && statusFilter !== 'pass') {
      throw new BadRequestException('无效的考核状态筛选');
    }

    const rows: NewcomerRow[] = trimmed
      ? await this.db
          .select()
          .from(newcomer)
          .where(ilike(newcomer.name, `%${trimmed}%`))
          .orderBy(desc(newcomer.createdAt))
      : await this.db.select().from(newcomer).orderBy(desc(newcomer.createdAt));

    if (rows.length === 0) return { items: [], total: 0 };

    const ids: string[] = rows.map((r: NewcomerRow) => r.id);
    const [totalTaskRows, completedRows, assessmentRows] = await Promise.all([
      this.db.select({ total: count() }).from(challengeTask),
      this.db
        .select({ newcomerId: taskRecord.newcomerId })
        .from(taskRecord)
        .where(and(inArray(taskRecord.newcomerId, ids), isNotNull(taskRecord.completedAt))),
      this.db.select().from(assessmentRecord).where(inArray(assessmentRecord.newcomerId, ids)),
    ]);
    const totalTasks = Number(totalTaskRows[0]?.total ?? 0);

    const completedMap = new Map<string, number>();
    for (const row of completedRows) {
      completedMap.set(row.newcomerId, (completedMap.get(row.newcomerId) ?? 0) + 1);
    }
    const assessmentMap = new Map<string, AssessmentRow[]>();
    for (const row of assessmentRows) {
      const list = assessmentMap.get(row.newcomerId) ?? [];
      list.push(row);
      assessmentMap.set(row.newcomerId, list);
    }

    interface Candidate {
      row: NewcomerRow;
      stage: GrowthStage;
      dayCount: number;
      pending: boolean;
      passedLatest: boolean;
      assessmentText: string;
    }
    const candidates: Candidate[] = [];
    for (const row of rows) {
      const { stage: rowStage, dayCount } = resolveGrowthStage(row.hireDate);
      if (stageFilter && rowStage !== stageFilter) continue;

      const records = (assessmentMap.get(row.id) ?? []).slice().sort((a, b) => {
        if (a.recordDate === b.recordDate) {
          return a.createdAt.getTime() - b.createdAt.getTime();
        }
        return a.recordDate < b.recordDate ? -1 : 1;
      });
      const latest: AssessmentRow | null = records.length > 0 ? records[records.length - 1]! : null;
      const reachedNodes = [30, 60, 90].filter((n) => dayCount >= n);
      const hasNodeRecord = (n: number): boolean =>
        records.some((r) => r.node === `d${n}`);
      const pending =
        reachedNodes.length > 0 &&
        (reachedNodes.some((n) => !hasNodeRecord(n)) || (latest !== null && latest.result === 'fail'));
      const passedLatest = latest !== null && latest.result === 'pass';

      if (statusFilter === 'pending' && !pending) continue;
      if (statusFilter === 'pass' && !passedLatest) continue;

      let assessmentText: string;
      if (latest === null) {
        assessmentText = dayCount < 30 ? '未到考核期' : '待考核';
      } else {
        const nodeCn = NODE_FROM_DB[latest.node] ?? latest.node;
        const resultCn = RESULT_FROM_DB[latest.result] ?? latest.result;
        assessmentText = `${nodeCn}考核${resultCn}`;
      }

      candidates.push({ row, stage: rowStage, dayCount, pending, passedLatest, assessmentText });
    }

    const total = candidates.length;
    const size = Math.min(Math.max(pageSize, 1), 100);
    const start = Math.max(offset, 0);
    const pageCandidates = candidates.slice(start, start + size);

    const pageIds = pageCandidates.map((c) => c.row.id);
    const [courses, examRows] =
      pageIds.length > 0
        ? await Promise.all([
            this.db.select({ id: course.id, title: course.title }).from(course),
            this.db
              .select({
                newcomerId: examResult.newcomerId,
                courseId: examResult.courseId,
                passed: examResult.passed,
                takenAt: examResult.takenAt,
              })
              .from(examResult)
              .where(inArray(examResult.newcomerId, pageIds)),
          ])
        : [[], []];

    const examMap = new Map<string, ExamRowLite[]>();
    for (const row of examRows) {
      const list = examMap.get(row.newcomerId) ?? [];
      list.push({ courseId: row.courseId, passed: row.passed, takenAt: row.takenAt });
      examMap.set(row.newcomerId, list);
    }

    const mentorIds = pageCandidates
      .map((c) => c.row.mentor)
      .filter((m): m is string => typeof m === 'string' && m.length > 0);
    const userMap = await this.resolveUserMap(mentorIds);

    const items: NewcomerSummary[] = pageCandidates.map((c) => {
      const passStatus = this.buildPassStatus(courses, examMap.get(c.row.id) ?? []);
      const passedLabels = passStatus.filter((p) => p.passed).map((p) => p.label);
      const completed = completedMap.get(c.row.id) ?? 0;
      return {
        id: c.row.id,
        name: c.row.name,
        userId: c.row.userId,
        position: POSITION_FROM_DB[c.row.position] ?? '销售顾问',
        hireDate: c.row.hireDate,
        mentorId: c.row.mentor,
        mentorName:
          c.row.mentor == null
            ? '未分配'
            : userMap.get(c.row.mentor)?.name || '未知',
        stage: c.stage,
        dayCount: c.dayCount,
        challengeProgress:
          totalTasks === 0 ? 0 : Math.floor((completed / totalTasks) * 100),
        passSummary: passedLabels.length > 0 ? passedLabels.join(' ') : '暂未通关',
        assessmentStatus: c.assessmentText,
        status: STATUS_FROM_DB[c.row.status] ?? '在培',
      };
    });

    return { items, total };
  }

  async getNewcomerDetail(id: string): Promise<NewcomerDetail> {
    const [row] = await this.db.select().from(newcomer).where(eq(newcomer.id, id));
    if (!row) throw new NotFoundException('新人档案不存在');

    const [assessmentRows, courses, examRows, taskRows] = await Promise.all([
      this.db
        .select()
        .from(assessmentRecord)
        .where(eq(assessmentRecord.newcomerId, id))
        .orderBy(desc(assessmentRecord.recordDate), desc(assessmentRecord.createdAt)),
      this.db.select({ id: course.id, title: course.title }).from(course),
      this.db
        .select({
          courseId: examResult.courseId,
          passed: examResult.passed,
          takenAt: examResult.takenAt,
        })
        .from(examResult)
        .where(eq(examResult.newcomerId, id)),
      this.db
        .select({
          title: challengeTask.title,
          category: challengeTask.category,
          stage: challengeTask.stage,
          standard: challengeTask.standard,
          dueDay: challengeTask.dueDay,
          completedAt: taskRecord.completedAt,
        })
        .from(challengeTask)
        .leftJoin(
          taskRecord,
          and(eq(taskRecord.taskId, challengeTask.id), eq(taskRecord.newcomerId, id)),
        )
        .orderBy(challengeTask.sort),
    ]);

    const userIds: string[] = [];
    if (typeof row.mentor === 'string' && row.mentor.length > 0) userIds.push(row.mentor);
    for (const a of assessmentRows) {
      if (typeof a.createdBy === 'string' && a.createdBy.length > 0) userIds.push(a.createdBy);
    }
    const userMap = await this.resolveUserMap(userIds);

    const { stage, dayCount } = resolveGrowthStage(row.hireDate);
    const exams: ExamRowLite[] = examRows.map((e) => ({
      courseId: e.courseId,
      passed: e.passed,
      takenAt: e.takenAt,
    }));
    const passStatus = this.buildPassStatus(courses, exams);

    const assessments: AssessmentRecord[] = assessmentRows.map((a) => ({
      id: a.id,
      node: (NODE_FROM_DB[a.node] ?? a.node) as AssessmentRecord['node'],
      result: (RESULT_FROM_DB[a.result] ?? a.result) as AssessmentRecord['result'],
      comment: a.assessComment,
      recordDate: a.recordDate,
      assessorName:
        typeof a.createdBy === 'string' && a.createdBy.length > 0
          ? userMap.get(a.createdBy)?.name || '未知'
          : '未知',
    }));

    const challengeTasks: NewcomerChallengeTask[] = taskRows.map((t) => ({
      title: t.title,
      category: t.category,
      stage: toStageLabel(t.stage, t.dueDay),
      standard: t.standard,
      dueDay: t.dueDay,
      completed: t.completedAt != null,
      completedAt: t.completedAt != null ? t.completedAt.toISOString() : null,
    }));
    const completedCount = challengeTasks.filter((t) => t.completed).length;
    const challengeProgress =
      challengeTasks.length === 0
        ? 0
        : Math.floor((completedCount / challengeTasks.length) * 100);

    return {
      id: row.id,
      name: row.name,
      position: POSITION_FROM_DB[row.position] ?? '销售顾问',
      hireDate: row.hireDate,
      mentorId: row.mentor,
      mentorName:
        row.mentor == null ? '未分配' : userMap.get(row.mentor)?.name || '未知',
      goalContract: row.goalContract ?? '',
      status: STATUS_FROM_DB[row.status] ?? '在培',
      firstDealDate: row.firstDealDate,
      stage,
      dayCount,
      challengeProgress,
      assessments,
      passStatus,
      challengeTasks,
    };
  }

  async createNewcomer(
    dto: CreateNewcomerRequest,
    userId: string,
  ): Promise<{ id: string; stage: GrowthStage; dayCount: number }> {
    if (!dto || typeof dto.name !== 'string' || dto.name.trim().length === 0) {
      throw new BadRequestException('姓名必填');
    }
    if (!dto.position || !POSITION_TO_DB[dto.position]) {
      throw new BadRequestException('岗位必填且必须为：销售顾问');
    }
    if (!dto.hireDate || !/^\d{4}-\d{2}-\d{2}$/.test(dto.hireDate)) {
      throw new BadRequestException('入职日期必填且格式应为 YYYY-MM-DD');
    }

    if (dto.bindToCurrentAccount === true) {
      const [bound] = await this.db
        .select({ id: newcomer.id })
        .from(newcomer)
        .where(eq(newcomer.userId, userId))
        .limit(1);
      if (bound) {
        throw new ConflictException('当前账号已关联新人档案，无需重复导入');
      }
    }

    const id = await this.insertNewcomerWithTasks(
      {
        name: dto.name.trim(),
        position: POSITION_TO_DB[dto.position],
        hireDate: dto.hireDate,
        mentor: dto.mentorId ?? null,
        goalContract: dto.goalContract ?? null,
        userId: dto.bindToCurrentAccount === true ? userId : null,
      },
      userId,
    );

    return { id, ...resolveGrowthStage(dto.hireDate) };
  }

  async createNewcomerForUser(
    dto: CreateNewcomerByUserRequest,
    operatorId: string,
  ): Promise<{ id: string; name: string; stage: GrowthStage; dayCount: number }> {
    if (!dto || typeof dto.userId !== 'string' || dto.userId.length === 0) {
      throw new BadRequestException('请选择人员');
    }
    if (!dto.position || !POSITION_TO_DB[dto.position]) {
      throw new BadRequestException('岗位必填且必须为：销售顾问');
    }
    if (!dto.hireDate || !/^\d{4}-\d{2}-\d{2}$/.test(dto.hireDate)) {
      throw new BadRequestException('入职日期必填且格式应为 YYYY-MM-DD');
    }

    const [bound] = await this.db
      .select({ id: newcomer.id })
      .from(newcomer)
      .where(eq(newcomer.userId, dto.userId))
      .limit(1);
    if (bound) {
      throw new ConflictException('该人员已关联新人档案');
    }

    const [user] = await this.directory.listUsersByIds([dto.userId]);
    if (user == null) {
      throw new BadRequestException('所选人员不存在');
    }
    const name: string = user.name?.zh_cn ?? user.name?.en_us ?? '';
    if (name === '') {
      throw new BadRequestException('无法获取所选人员姓名');
    }

    const id = await this.insertNewcomerWithTasks(
      {
        name,
        position: POSITION_TO_DB[dto.position],
        hireDate: dto.hireDate,
        mentor: dto.mentorId ?? null,
        goalContract: dto.goalContract ?? null,
        userId: dto.userId,
      },
      operatorId,
    );

    return { id, name, ...resolveGrowthStage(dto.hireDate) };
  }

  /** 插入新人档案并同步生成闯关任务记录（同一事务） */
  private async insertNewcomerWithTasks(
    values: typeof newcomer.$inferInsert,
    operatorId: string,
  ): Promise<string> {
    const result = await this.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(newcomer)
        .values(values)
        .returning({ id: newcomer.id });
      if (!created) throw new BadRequestException('新建新人失败');

      const tasks = await tx.select({ id: challengeTask.id }).from(challengeTask);
      if (tasks.length > 0) {
        await tx
          .insert(taskRecord)
          .values(tasks.map((t) => ({ newcomerId: created.id, taskId: t.id })));
      }
      return created;
    });

    this.logger.log(`新建新人档案成功 id=${result.id} operator=${operatorId}`);
    return result.id;
  }

  async updateNewcomer(
    id: string,
    dto: UpdateNewcomerRequest,
    userId: string,
  ): Promise<{ id: string }> {
    const [existing] = await this.db
      .select({ id: newcomer.id })
      .from(newcomer)
      .where(eq(newcomer.id, id));
    if (!existing) throw new NotFoundException('新人档案不存在');

    const patch: Partial<typeof newcomer.$inferInsert> = {};
    if (dto.mentorId !== undefined) patch.mentor = dto.mentorId;
    if (dto.goalContract !== undefined) patch.goalContract = dto.goalContract;
    if (dto.status !== undefined) {
      const dbStatus = STATUS_TO_DB[dto.status];
      if (!dbStatus) throw new BadRequestException('无效的状态');
      patch.status = dbStatus;
    }
    if (dto.firstDealDate !== undefined) patch.firstDealDate = dto.firstDealDate;
    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    patch.updatedAt = new Date();
    patch.updatedBy = userId;

    const [updated] = await this.db
      .update(newcomer)
      .set(patch)
      .where(eq(newcomer.id, id))
      .returning({ id: newcomer.id });
    if (!updated) throw new NotFoundException('新人档案不存在');
    return { id: updated.id };
  }

  async deleteNewcomer(id: string): Promise<void> {
    const deleted = await this.db.transaction(async (tx) => {
      await tx.delete(taskRecord).where(eq(taskRecord.newcomerId, id));
      await tx.delete(courseLearning).where(eq(courseLearning.newcomerId, id));
      await tx.delete(examResult).where(eq(examResult.newcomerId, id));
      await tx.delete(coachingRecord).where(eq(coachingRecord.newcomerId, id));
      await tx.delete(reviewRecord).where(eq(reviewRecord.newcomerId, id));
      await tx.delete(assessmentRecord).where(eq(assessmentRecord.newcomerId, id));
      return tx.delete(newcomer).where(eq(newcomer.id, id)).returning({ id: newcomer.id });
    });
    if (deleted.length === 0) throw new NotFoundException('记录不存在');
  }

  async createAssessment(
    dto: CreateAssessmentRequest,
    userId: string,
  ): Promise<{ id: string }> {
    if (!dto || !dto.newcomerId) throw new BadRequestException('newcomerId 必填');
    if (!dto.node || !NODE_TO_DB[dto.node]) {
      throw new BadRequestException('考核节点必填且必须为：30天/60天/90天');
    }
    if (!dto.result || !RESULT_TO_DB[dto.result]) {
      throw new BadRequestException('评估结论必填且必须为：通过/待改进/不通过');
    }
    if (!dto.recordDate || !/^\d{4}-\d{2}-\d{2}$/.test(dto.recordDate)) {
      throw new BadRequestException('考核日期必填且格式应为 YYYY-MM-DD');
    }

    const [existing] = await this.db
      .select({ id: newcomer.id })
      .from(newcomer)
      .where(eq(newcomer.id, dto.newcomerId));
    if (!existing) throw new NotFoundException('新人档案不存在');

    const [created] = await this.db
      .insert(assessmentRecord)
      .values({
        newcomerId: dto.newcomerId,
        node: NODE_TO_DB[dto.node],
        result: RESULT_TO_DB[dto.result],
        assessComment: dto.comment ?? '',
        recordDate: dto.recordDate,
      })
      .returning({ id: assessmentRecord.id });
    if (!created) throw new BadRequestException('考核记录创建失败');

    this.logger.log(`新增节点考核留档 id=${created.id} operator=${userId}`);
    return { id: created.id };
  }

  /** 批量解析妙搭用户 ID → 姓名/头像（分批 100，不吞平台错误） */
  private async resolveUserMap(
    ids: string[],
  ): Promise<Map<string, { name: string; avatar: string }>> {
    const unique = Array.from(new Set(ids.filter((i) => i.length > 0)));
    const map = new Map<string, { name: string; avatar: string }>();
    for (let i = 0; i < unique.length; i += 100) {
      const chunk = unique.slice(i, i + 100);
      const users = await this.directory.listUsersByIds(chunk);
      users.forEach((u, idx: number) => {
        const uid = chunk[idx];
        if (u != null && uid != null) {
          map.set(uid, {
            name: u.name?.zh_cn ?? u.name?.en_us ?? '',
            avatar: u.avatar?.image?.large ?? '',
          });
        }
      });
    }
    return map;
  }

  /** 转正答辩概览：所有在培新人的答辩就绪状态 */
  async getDefenseOverview(): Promise<DefenseOverviewResponse> {
    const rows: NewcomerRow[] = await this.db
      .select()
      .from(newcomer)
      .orderBy(desc(newcomer.createdAt));

    if (rows.length === 0) {
      return { items: [], stats: { total: 0, readyCount: 0, convertedCount: 0 } };
    }

    const ids: string[] = rows.map((r: NewcomerRow) => r.id);
    const [courses, examRows, assessmentRows] = await Promise.all([
      this.db.select({ id: course.id, title: course.title }).from(course),
      this.db
        .select({
          newcomerId: examResult.newcomerId,
          courseId: examResult.courseId,
          passed: examResult.passed,
          takenAt: examResult.takenAt,
        })
        .from(examResult)
        .where(inArray(examResult.newcomerId, ids)),
      this.db
        .select()
        .from(assessmentRecord)
        .where(inArray(assessmentRecord.newcomerId, ids)),
    ]);

    const examMap = new Map<string, ExamRowLite[]>();
    for (const row of examRows) {
      const list = examMap.get(row.newcomerId) ?? [];
      list.push({ courseId: row.courseId, passed: row.passed, takenAt: row.takenAt });
      examMap.set(row.newcomerId, list);
    }

    const assessmentMap = new Map<string, string[]>();
    for (const row of assessmentRows) {
      const list = assessmentMap.get(row.newcomerId) ?? [];
      list.push(row.node);
      assessmentMap.set(row.newcomerId, list);
    }

    const mentorIds: string[] = rows
      .map((r: NewcomerRow) => r.mentor)
      .filter((m): m is string => typeof m === 'string' && m.length > 0);
    const userMap = await this.resolveUserMap(mentorIds);

    const NODE_DAYS: Array<{ node: string; days: number }> = [
      { node: 'd30', days: 30 },
      { node: 'd60', days: 60 },
      { node: 'd90', days: 90 },
    ];

    let readyCount = 0;
    let convertedCount = 0;

    const items: DefenseOverviewItem[] = rows.map((row: NewcomerRow) => {
      const { stage, dayCount } = resolveGrowthStage(row.hireDate);
      const exams = examMap.get(row.id) ?? [];
      const passStatus = this.buildPassStatus(courses, exams);
      const totalPassItems = passStatus.filter((p) => p.passed).length;

      const existingNodes = assessmentMap.get(row.id) ?? [];
      const applicableNodes = NODE_DAYS.filter((n) => dayCount >= n.days);
      const completedAssessments = applicableNodes.filter((n) =>
        existingNodes.includes(n.node),
      ).length;

      const defenseReady =
        totalPassItems >= 3 && completedAssessments >= applicableNodes.length;

      const status: DefenseOverviewItem['status'] =
        row.status === 'converted' ? '已转正' : row.status === 'left' ? '已离职' : '在培';

      if (defenseReady) readyCount++;
      if (status === '已转正') convertedCount++;

      return {
        id: row.id,
        name: row.name,
        position: '销售顾问' as const,
        hireDate: row.hireDate,
        stage,
        dayCount,
        mentorName:
          row.mentor == null
            ? '未分配'
            : userMap.get(row.mentor)?.name || '未知',
        totalPassItems,
        completedAssessments,
        defenseReady,
        status,
      };
    });

    return {
      items,
      stats: {
        total: rows.length,
        readyCount,
        convertedCount,
      },
    };
  }

  /** 按通关映射生成三项通关状态 */
  private buildPassStatus(
    courses: Array<{ id: string; title: string }>,
    exams: ExamRowLite[],
  ): PassStatusItem[] {
    return PASS_GROUPS.map((group) => {
      const groupCourses = courses.filter((c) => group.match(c.title));
      const passedExams = exams.filter(
        (e) => e.passed && groupCourses.some((c) => c.id === e.courseId),
      );
      const passed =
        groupCourses.length > 0 &&
        groupCourses.every((c) => passedExams.some((e) => e.courseId === c.id));
      let passedAt: string | null = null;
      if (passedExams.length > 0) {
        const latest = passedExams.reduce(
          (acc, cur) => (cur.takenAt.getTime() > acc.getTime() ? cur.takenAt : acc),
          passedExams[0]!.takenAt,
        );
        passedAt = latest.toISOString();
      }
      return { key: group.key, label: group.label, passed, passedAt };
    });
  }
}
