import type { GrowthStage } from './common';

/** 新人档案（列表行） */
export interface NewcomerSummary {
  id: string;
  name: string;
  userId: string | null;
  position: '销售顾问';
  hireDate: string;
  mentorId: string | null;
  mentorName: string;
  stage: GrowthStage;
  dayCount: number;
  challengeProgress: number;
  passSummary: string;
  assessmentStatus: string;
  status: '在培' | '已转正' | '已离职';
}

/** 节点考核留档 */
export interface AssessmentRecord {
  id: string;
  node: '30天' | '60天' | '90天';
  result: '通过' | '待改进' | '不通过';
  comment: string;
  recordDate: string;
  assessorName: string;
}

/** 通关状态项 */
export interface PassStatusItem {
  key: string;
  label: string;
  passed: boolean;
  passedAt: string | null;
}

/** 新人闯关任务明细项 */
export interface NewcomerChallengeTask {
  title: string;
  category: string;
  stage: GrowthStage;
  standard: string;
  dueDay: number;
  completed: boolean;
  completedAt: string | null;
}

/** 新人档案详情 */
export interface NewcomerDetail {
  id: string;
  name: string;
  position: '销售顾问';
  hireDate: string;
  mentorId: string | null;
  mentorName: string;
  goalContract: string;
  status: '在培' | '已转正' | '已离职';
  firstDealDate: string | null;
  stage: GrowthStage;
  dayCount: number;
  challengeProgress: number;
  assessments: AssessmentRecord[];
  passStatus: PassStatusItem[];
  challengeTasks: NewcomerChallengeTask[];
}

/** 新人列表查询参数 */
export interface NewcomerListQuery {
  keyword?: string;
  stage?: GrowthStage | '';
  assessmentStatus?: string;
  offset?: number;
  pageSize?: number;
}

/** 新建新人请求 */
export interface CreateNewcomerRequest {
  name: string;
  position: '销售顾问';
  hireDate: string;
  mentorId?: string;
  goalContract?: string;
  /** 为 true 时将新档案的关联账号绑定为当前操作用户（供工作台导入入口使用） */
  bindToCurrentAccount?: boolean;
}

/** 管理员按人员新建新人请求（从人员清单选择账号绑定） */
export interface CreateNewcomerByUserRequest {
  userId: string;
  position: '销售顾问';
  hireDate: string;
  mentorId?: string;
  goalContract?: string;
}

/** 编辑新人请求（仅提交明确提供的字段） */
export interface UpdateNewcomerRequest {
  mentorId?: string | null;
  goalContract?: string;
  status?: '在培' | '已转正' | '已离职';
  firstDealDate?: string | null;
}

/** 提交节点考核请求 */
export interface CreateAssessmentRequest {
  newcomerId: string;
  node: '30天' | '60天' | '90天';
  result: '通过' | '待改进' | '不通过';
  comment: string;
  recordDate: string;
}

/** 新人入职申请状态 */
export type NewcomerApplicationStatus = 'pending' | 'approved' | 'rejected';

/** 新人入职申请行 */
export interface NewcomerApplicationItem {
  id: string;
  userId: string;
  name: string;
  position: '销售顾问';
  hireDate: string;
  mentorId: string | null;
  goalContract: string;
  status: NewcomerApplicationStatus;
  reviewComment: string | null;
  reviewedById: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

/** 新人入职申请列表响应 */
export interface NewcomerApplicationListResponse {
  items: NewcomerApplicationItem[];
  pendingCount: number;
}

/** 提交新人入职申请请求（申请人锁定为当前登录用户，姓名由服务端从通讯录获取，带教师傅由管理员后续指定） */
export interface CreateNewcomerApplicationRequest {
  position: '销售顾问';
  hireDate: string;
  goalContract?: string;
}

/** 审批新人入职申请请求 */
export interface ReviewNewcomerApplicationRequest {
  comment?: string;
}

/** 转正面试申请状态 */
export type DefenseApplicationStatus = 'pending' | 'scheduled' | 'approved' | 'rejected';

/** 转正面试申请 */
export interface DefenseApplicationItem {
  id: string;
  newcomerId: string;
  newcomerName: string;
  status: DefenseApplicationStatus;
  comment: string | null;
  createdAt: string;
  /** 通知发送时间，null=未发送 */
  notifiedAt: string | null;
  /** 通知是否发送失败 */
  notifyFailed: boolean;
}

/** 转正面试前置条件状态 */
export interface DefensePrerequisiteStatus {
  /** 阶段闯关是否全部完成 */
  stagesCompleted: boolean;
  /** 考核中心是否全部通过 */
  coursesPassed: boolean;
  /** 是否已有待审批/已安排的面试申请 */
  hasPendingApplication: boolean;
  /** 当前面试状态 */
  applicationStatus: DefenseApplicationStatus | null;
}

/** 转正答辩概览项 */
export interface DefenseOverviewItem {
  id: string;
  name: string;
  position: '销售顾问';
  hireDate: string;
  stage: GrowthStage;
  dayCount: number;
  mentorName: string;
  /** 已通关项数（0-3） */
  totalPassItems: number;
  /** 已完成的节点考核数（0-3） */
  completedAssessments: number;
  /** 是否答辩就绪：全部通关项通过 + 全部节点考核完成 */
  defenseReady: boolean;
  status: '在培' | '已转正' | '已离职';
}

/** 转正答辩概览响应 */
export interface DefenseOverviewResponse {
  items: DefenseOverviewItem[];
  stats: {
    total: number;
    readyCount: number;
    convertedCount: number;
  };
}
