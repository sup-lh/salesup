import type {
  GrowthStage,
  NewcomerListQuery,
  NewcomerSummary,
  AssessmentRecord,
} from '@shared/api.interface';

export interface OptionItem<T extends string> {
  value: T;
  label: string;
}

export const NEWCOMER_POSITION_OPTIONS: Array<
  OptionItem<NewcomerSummary['position']>
> = [
  { value: '销售顾问', label: '销售顾问' },
];

export const NEWCOMER_STATUS_OPTIONS: Array<OptionItem<NewcomerSummary['status']>> = [
  { value: '在培', label: '在培' },
  { value: '已转正', label: '已转正' },
  { value: '已离职', label: '已离职' },
];

export const NEWCOMER_STAGE_OPTIONS: Array<OptionItem<GrowthStage>> = [
  { value: '融入期', label: '融入期（1-30天）' },
  { value: '实战期', label: '实战期（31-60天）' },
  { value: '独立期', label: '独立期（61-90天）' },
  { value: '巩固期', label: '巩固期（91天起）' },
];

export const NEWCOMER_ASSESSMENT_STATUS_OPTIONS: Array<
  OptionItem<Exclude<NewcomerListQuery['assessmentStatus'], undefined>>
> = [
  { value: 'pending', label: '待考核' },
  { value: 'pass', label: '最新节点通过' },
];

export const ASSESSMENT_NODE_OPTIONS: Array<OptionItem<AssessmentRecord['node']>> = [
  { value: '30天', label: '30天节点' },
  { value: '60天', label: '60天节点' },
  { value: '90天', label: '90天节点' },
];

export const ASSESSMENT_RESULT_OPTIONS: Array<
  OptionItem<AssessmentRecord['result']>
> = [
  { value: '通过', label: '通过' },
  { value: '待改进', label: '待改进' },
  { value: '不通过', label: '不通过' },
];
