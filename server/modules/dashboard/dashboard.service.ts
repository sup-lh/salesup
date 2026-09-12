import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/database/database.module';
import { eq } from 'drizzle-orm';
import { GROWTH_STAGES, resolveGrowthStage } from '@shared/common';
import type { GrowthStage } from '@shared/common';
import type {
  ActionStats,
  CoursePassRateItem,
  DashboardKpiDeltas,
  DashboardKpis,
  DashboardPeriod,
  DashboardStatisticsResponse,
  StageDistributionItem,
} from '@shared/dashboard';
import {
  assessmentRecord,
  challengeTask,
  coachingRecord,
  course,
  examResult,
  newcomer,
  opportunity,
  taskRecord,
} from '@server/database/schema';

/** 各时间段对应的天数窗口 */
const PERIOD_DAYS: Record<Exclude<DashboardPeriod, 'all'>, number> = {
  quarter: 90,
  half_year: 180,
};

/** 统计人群的新人基础字段 */
interface NewcomerRow {
  id: string;
  hireDate: string;
  status: string;
  firstDealDate: string | null;
}

const DAY_MS = 86400000;

/** Date → 'YYYY-MM-DD'（按 UTC 日历日） */
function toDayString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** 两个 'YYYY-MM-DD' 日期相差的天数（a - b） */
function diffDays(a: string, b: string): number {
  return Math.round(
    (new Date(`${a}T00:00:00Z`).getTime() - new Date(`${b}T00:00:00Z`).getTime()) / DAY_MS,
  );
}

@Injectable()
export class DashboardService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getStatistics(period?: string): Promise<DashboardStatisticsResponse> {
    const normalized: DashboardPeriod =
      period === 'half_year' || period === 'all' ? period : 'quarter';
    const periodDays = normalized === 'all' ? null : PERIOD_DAYS[normalized];
    const now = new Date();
    const cutoffDay =
      periodDays === null
        ? null
        : toDayString(new Date(now.getTime() - periodDays * DAY_MS));

    // 一次性批量取回基础数据（小数据量，内存计算，避免 N+1）
    const [newcomerRows, d90Records, tasks, taskRecords, passedExams, courses, visits, opportunities] =
      await Promise.all([
        this.db
          .select({
            id: newcomer.id,
            hireDate: newcomer.hireDate,
            status: newcomer.status,
            firstDealDate: newcomer.firstDealDate,
          })
          .from(newcomer),
        this.db
          .select({
            newcomerId: assessmentRecord.newcomerId,
            recordDate: assessmentRecord.recordDate,
          })
          .from(assessmentRecord)
          .where(eq(assessmentRecord.node, 'd90')),
        this.db
          .select({
            id: challengeTask.id,
            stage: challengeTask.stage,
            category: challengeTask.category,
          })
          .from(challengeTask),
        this.db
          .select({
            newcomerId: taskRecord.newcomerId,
            taskId: taskRecord.taskId,
            completedAt: taskRecord.completedAt,
          })
          .from(taskRecord),
        this.db
          .select({
            newcomerId: examResult.newcomerId,
            courseId: examResult.courseId,
          })
          .from(examResult)
          .where(eq(examResult.passed, true)),
        this.db
          .select({ id: course.id, title: course.title, sort: course.sort })
          .from(course),
        this.db
          .select({
            type: coachingRecord.type,
            recordDate: coachingRecord.recordDate,
          })
          .from(coachingRecord),
        this.db
          .select({
            recordDate: opportunity.recordDate,
          })
          .from(opportunity),
      ]);

    const rows: NewcomerRow[] = newcomerRows;
    // 统计人群：按 hireDate 截断（all 时为全部新人）
    const population = rows.filter(
      (r: NewcomerRow) => cutoffDay === null || r.hireDate >= cutoffDay,
    );

    const kpis = this.computeKpis(population, d90Records);
    const kpiDeltas = this.computeKpiDeltas(rows, normalized, now);
    const stageDistribution = this.computeStageDistribution(population, tasks, taskRecords);
    const passRates = this.computePassRates(population, passedExams, courses);
    const actionStats = this.computeActionStats(
      population,
      visits,
      opportunities as Array<{ recordDate: string }>,
      taskRecords,
      cutoffDay,
    );

    return { kpis, kpiDeltas, stageDistribution, passRates, actionStats };
  }

  /** KPI：在培总数 / 留存率 / 转正率 / 平均达产周期 / 首单平均时间 */
  private computeKpis(
    population: NewcomerRow[],
    d90Records: Array<{ newcomerId: string; recordDate: string }>,
  ): DashboardKpis {
    const total = population.filter((r: NewcomerRow) => r.status === 'active').length;
    const totalCount = population.length;
    const notLeft = population.filter((r: NewcomerRow) => r.status !== 'left');
    const converted = population.filter((r: NewcomerRow) => r.status === 'converted');

    // 留存率口径：未离职人数 / 总人数 * 100 取整
    const retentionRate =
      totalCount === 0 ? 0 : Math.round((notLeft.length / totalCount) * 100);
    // 转正率口径（简化）：已转正人数 / 非离职人数 * 100 取整
    const conversionRate =
      notLeft.length === 0 ? 0 : Math.round((converted.length / notLeft.length) * 100);

    // 首单平均时间：有 firstDealDate 的新人 avg(firstDealDate - hireDate)
    const firstDealDays = population
      .filter((r: NewcomerRow) => r.firstDealDate !== null)
      .map((r: NewcomerRow) => diffDays(r.firstDealDate as string, r.hireDate));
    const avgFirstDealDays =
      firstDealDays.length === 0
        ? null
        : Math.round(
            firstDealDays.reduce((sum: number, d: number) => sum + d, 0) /
              firstDealDays.length,
          );

    // 平均达产周期：d90 考核通过记录 avg(recordDate - hireDate)
    const populationIds = new Set(population.map((r: NewcomerRow) => r.id));
    const hireById = new Map(population.map((r: NewcomerRow) => [r.id, r.hireDate]));
    const rampDays = d90Records
      .filter((r) => populationIds.has(r.newcomerId))
      .map(
        (r) =>
          diffDays(r.recordDate, hireById.get(r.newcomerId) as string),
      );
    const avgRampDays =
      rampDays.length === 0
        ? null
        : Math.round(
            rampDays.reduce((sum: number, d: number) => sum + d, 0) / rampDays.length,
          );

    return { total, retentionRate, conversionRate, avgRampDays, avgFirstDealDays };
  }

  /** KPI 较上一周期（等长前一段）的百分点差值；all 时恒为 0 */
  private computeKpiDeltas(
    rows: NewcomerRow[],
    period: DashboardPeriod,
    now: Date,
  ): DashboardKpiDeltas {
    if (period === 'all') return { retentionRate: 0, conversionRate: 0 };
    const days = PERIOD_DAYS[period];
    const cutoffDay = toDayString(new Date(now.getTime() - days * DAY_MS));
    const prevCutoffDay = toDayString(new Date(now.getTime() - 2 * days * DAY_MS));
    const prev = rows.filter(
      (r: NewcomerRow) => r.hireDate >= prevCutoffDay && r.hireDate < cutoffDay,
    );
    const prevTotal = prev.length;
    const prevNotLeft = prev.filter((r: NewcomerRow) => r.status !== 'left');
    const prevConverted = prev.filter((r: NewcomerRow) => r.status === 'converted');
    const prevRetention =
      prevTotal === 0 ? 0 : Math.round((prevNotLeft.length / prevTotal) * 100);
    const prevConversion =
      prevNotLeft.length === 0
        ? 0
        : Math.round((prevConverted.length / prevNotLeft.length) * 100);

    const current = rows.filter((r: NewcomerRow) => r.hireDate >= cutoffDay);
    const curTotal = current.length;
    const curNotLeft = current.filter((r: NewcomerRow) => r.status !== 'left');
    const curConverted = current.filter((r: NewcomerRow) => r.status === 'converted');
    const curRetention =
      curTotal === 0 ? 0 : Math.round((curNotLeft.length / curTotal) * 100);
    const curConversion =
      curNotLeft.length === 0
        ? 0
        : Math.round((curConverted.length / curNotLeft.length) * 100);

    return {
      retentionRate: curRetention - prevRetention,
      conversionRate: curConversion - prevConversion,
    };
  }

  /** 四阶段在培人数 + 各阶段平均闯关进度（该阶段任务完成率 * 100 取整） */
  private computeStageDistribution(
    population: NewcomerRow[],
    tasks: Array<{ id: string; stage: string }>,
    taskRecords: Array<{
      newcomerId: string;
      taskId: string;
      completedAt: Date | null;
    }>,
  ): StageDistributionItem[] {
    const STAGE_FROM_DB: Record<string, GrowthStage> = {
      onboarding: '融入期',
      practice: '实战期',
      independent: '独立期',
      consolidation: '巩固期',
    };
    const active = population.filter((r: NewcomerRow) => r.status === 'active');
    const stageTaskIds = new Map<string, Set<string>>();
    for (const stage of GROWTH_STAGES) stageTaskIds.set(stage, new Set<string>());
    for (const task of tasks) {
      const stageName = STAGE_FROM_DB[task.stage];
      if (stageName) stageTaskIds.get(stageName)?.add(task.id);
    }
    const completedByNewcomer = new Map<string, Set<string>>();
    for (const record of taskRecords) {
      if (record.completedAt === null) continue;
      const set = completedByNewcomer.get(record.newcomerId) ?? new Set<string>();
      set.add(record.taskId);
      completedByNewcomer.set(record.newcomerId, set);
    }

    return GROWTH_STAGES.map((stage) => {
      const stageNewcomers = active.filter(
        (r: NewcomerRow) => resolveGrowthStage(r.hireDate).stage === stage,
      );
      const taskIds = stageTaskIds.get(stage) ?? new Set<string>();
      const totalSlots = stageNewcomers.length * taskIds.size;
      let completed = 0;
      for (const row of stageNewcomers) {
        const done = completedByNewcomer.get(row.id);
        if (!done) continue;
        for (const taskId of taskIds) {
          if (done.has(taskId)) completed += 1;
        }
      }
      const avgProgress =
        totalSlots === 0 ? 0 : Math.round((completed / totalSlots) * 100);
      return { stage, count: stageNewcomers.length, avgProgress };
    });
  }

  /** 五课程通过率：有 passed=true 考试记录的新人数 / 统计人群总数 * 100 取整 */
  private computePassRates(
    population: NewcomerRow[],
    passedExams: Array<{ newcomerId: string; courseId: string }>,
    courses: Array<{ id: string; title: string; sort: number }>,
  ): CoursePassRateItem[] {
    const populationIds = new Set(population.map((r: NewcomerRow) => r.id));
    const passedByCourse = new Map<string, Set<string>>();
    for (const exam of passedExams) {
      if (!populationIds.has(exam.newcomerId)) continue;
      const set = passedByCourse.get(exam.courseId) ?? new Set<string>();
      set.add(exam.newcomerId);
      passedByCourse.set(exam.courseId, set);
    }
    const sorted = [...courses].sort((a, b) => a.sort - b.sort);
    return sorted.map((c) => {
      const passedCount = passedByCourse.get(c.id)?.size ?? 0;
      const rate =
        population.length === 0
          ? 0
          : Math.round((passedCount / population.length) * 100);
      return { courseTitle: c.title, passRate: rate };
    });
  }

  /** 关键动作：有效拜访量（拜访类带教记录）/ 商机录入量（商机表）/ 打卡完成率 */
  private computeActionStats(
    population: NewcomerRow[],
    visits: Array<{ type: string; recordDate: string }>,
    opportunities: Array<{ recordDate: string }>,
    taskRecords: Array<{
      newcomerId: string;
      taskId: string;
      completedAt: Date | null;
    }>,
    cutoffDay: string | null,
  ): ActionStats {
    const cutoffTime = cutoffDay === null ? null : new Date(`${cutoffDay}T00:00:00Z`).getTime();

    // 有效拜访量：拜访类带教记录（陪访/拜访/带教陪访）且 recordDate 在期内
    const visitTypes = new Set(['visit', 'customer_visit', 'mentor_visit']);
    const visitCount = visits.filter(
      (v) =>
        visitTypes.has(v.type) &&
        (cutoffDay === null || v.recordDate >= cutoffDay),
    ).length;

    // 商机录入量：商机表 recordDate 在期内
    const opportunityCount = opportunities.filter(
      (o) => cutoffDay === null || o.recordDate >= cutoffDay,
    ).length;

    // 打卡完成率（粗略口径）：统计人群的全部闯关记录中，期内已完成的比例
    const populationIds = new Set(population.map((r: NewcomerRow) => r.id));
    const inWindow = (completedAt: Date | null): boolean => {
      if (completedAt === null) return false;
      if (cutoffTime === null) return true;
      return completedAt.getTime() >= cutoffTime;
    };
    const populationTaskRecords = taskRecords.filter((r) =>
      populationIds.has(r.newcomerId),
    );
    const completedCount = populationTaskRecords.filter((r) =>
      inWindow(r.completedAt),
    ).length;
    const checkinRate =
      populationTaskRecords.length === 0
        ? 0
        : Math.round((completedCount / populationTaskRecords.length) * 100);

    return { visitCount, opportunityCount, checkinRate };
  }
}
