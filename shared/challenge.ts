import type { GrowthStage } from './common';
import type { PassStatusItem } from './newcomer';

/** 闯关任务（含打卡状态） */
export interface ChallengeTaskItem {
  recordId: string;
  taskId: string;
  title: string;
  category: string;
  standard: string;
  dueDay: number;
  unlockNextStage: boolean;
  completed: boolean;
  completedAt: string | null;
}

/** 阶段任务分组 */
export interface ChallengeStageGroup {
  stage: GrowthStage;
  standard: string;
  progress: number;
  unlocked: boolean;
  unlockCondition: string;
  tasks: ChallengeTaskItem[];
}

/** 任务筛选 */
export type ChallengeFilter = 'today' | 'pending' | 'done';

/** 闯关地图响应 */
export interface ChallengeRecordsResponse {
  hasProfile: boolean;
  stages: ChallengeStageGroup[];
}

/** 任务打卡请求 */
export interface TaskCheckinRequest {
  recordId: string;
}

/** 任务打卡响应 */
export interface TaskCheckinResponse {
  id: string;
  completedAt: string;
}

/** 取消任务打卡响应 */
export interface TaskCancelCheckinResponse {
  id: string;
}

/** 闯关任务模板（管理端编辑用） */
export interface ChallengeTaskTemplate {
  id: string;
  stage: string;
  title: string;
  category: string;
  standard: string;
  dueDay: number;
  unlockNextStage: boolean;
  sort: number;
}

/** 闯关任务模板列表响应 */
export interface ChallengeTaskListResponse {
  items: ChallengeTaskTemplate[];
}

/** 更新闯关任务请求 */
export interface UpdateChallengeTaskRequest {
  stage: string;
  title: string;
  category: string;
  standard: string;
  dueDay: number;
  unlockNextStage?: boolean;
}

/** 新增闯关任务请求 */
export interface CreateChallengeTaskRequest {
  stage: string;
  title: string;
  category: string;
  standard: string;
  dueDay: number;
  unlockNextStage?: boolean;
}

/** 今日任务项 */
export interface TodayTaskItem {
  recordId: string;
  title: string;
  standard: string;
  dueDay: number;
  completed: boolean;
}

/** 带教信息卡 */
export interface MentorInfo {
  mentorId: string | null;
  name: string;
  avatar: string | null;
  weeklyVisits: number;
  recentRecords: string[];
}

/** 工作台聚合响应（当前用户无新人档案时 newcomer 为 null） */
export interface WorkbenchResponse {
  newcomer: null | {
    id: string;
    name: string;
    position: string;
    hireDate: string;
    stage: GrowthStage;
    dayCount: number;
  };
  stageProgress: Array<{
    stage: GrowthStage;
    status: '已完成' | '进行中' | '未解锁';
    standard: string;
    progress: number;
  }>;
  todayTasks: TodayTaskItem[];
  passStatus: PassStatusItem[];
  mentor: MentorInfo | null;
}
