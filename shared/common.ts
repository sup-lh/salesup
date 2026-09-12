/* 前后端共享的公共类型与成长阶段规则 */

/** 成长阶段（四阶段划分） */
export type GrowthStage = '融入期' | '实战期' | '独立期' | '巩固期';

/** 阶段顺序常量（运行时可用） */
export const GROWTH_STAGES: GrowthStage[] = ['融入期', '实战期', '独立期', '巩固期'];

/** 阶段天数边界：第 1~30 天融入期、31~60 实战期、61~90 独立期、91 起巩固期 */
export const STAGE_DAY_RANGES: Array<{ stage: GrowthStage; startDay: number; endDay: number }> = [
  { stage: '融入期', startDay: 1, endDay: 30 },
  { stage: '实战期', startDay: 31, endDay: 60 },
  { stage: '独立期', startDay: 61, endDay: 90 },
  { stage: '巩固期', startDay: 91, endDay: Number.MAX_SAFE_INTEGER },
];

/** 各阶段通关标准 */
export const STAGE_STANDARDS: Record<GrowthStage, string> = {
  融入期: '产品知识通关、话术通关、工具使用达标',
  实战期: '完成跟单量、有效拜访量、商机录入达标',
  独立期: '独立完成销售流程、达成阶段业绩目标',
  巩固期: '连续达标、转正定级、进入梯队培养',
};

/** offset 分页统一响应 */
export interface PagedResult<T> {
  items: T[];
  total: number;
}

/** offset 分页统一查询参数（由前端拼接到 query string） */
export interface PagedQuery {
  offset?: number;
  pageSize?: number;
}

/** 根据入职日期与当前日期计算成长阶段与已进行天数（纯函数，前后端通用） */
export function resolveGrowthStage(hireDate: string, today: Date = new Date()): {
  stage: GrowthStage;
  dayCount: number;
} {
  const hire = new Date(`${hireDate}T00:00:00+08:00`);
  const dayCount = Math.max(
    1,
    Math.floor((today.getTime() - hire.getTime()) / 86400000) + 1,
  );
  const range = STAGE_DAY_RANGES.find((r) => dayCount >= r.startDay && dayCount <= r.endDay);
  return { stage: range ? range.stage : '巩固期', dayCount };
}
