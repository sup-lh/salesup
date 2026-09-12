import type { GrowthStage } from './common';

/** 看板统计时间段 */
export type DashboardPeriod = 'quarter' | 'half_year' | 'all';

/** KPI 指标 */
export interface DashboardKpis {
  total: number;
  retentionRate: number;
  conversionRate: number;
  avgRampDays: number | null;
  avgFirstDealDays: number | null;
}

/** KPI 较上期变化（百分点） */
export interface DashboardKpiDeltas {
  retentionRate: number;
  conversionRate: number;
}

/** 阶段分布 */
export interface StageDistributionItem {
  stage: GrowthStage;
  count: number;
  avgProgress: number;
}

/** 模块通关通过率 */
export interface CoursePassRateItem {
  courseTitle: string;
  passRate: number;
}

/** 关键动作完成情况 */
export interface ActionStats {
  visitCount: number;
  opportunityCount: number;
  checkinRate: number;
}

/** 看板统计响应 */
export interface DashboardStatisticsResponse {
  kpis: DashboardKpis;
  kpiDeltas: DashboardKpiDeltas;
  stageDistribution: StageDistributionItem[];
  passRates: CoursePassRateItem[];
  actionStats: ActionStats;
}
