/** 记录材料（本地文件或飞书云文档/妙记链接） */
export interface RecordMaterial {
  name: string;
  url: string;
  source: 'upload' | 'external_link';
}

/** 带教记录 */
export interface CoachingRecord {
  id: string;
  type: '陪访' | '一对一辅导' | '拜访' | '带教陪访';
  coachId: string | null;
  coachName: string;
  recordDate: string;
  durationHours: number;
  content: string;
  improvement: string;
  materials: RecordMaterial[];
}

/** 带教记录列表查询 */
export interface CoachingListQuery {
  type?: string;
  startDate?: string;
  endDate?: string;
  offset?: number;
  pageSize?: number;
}

/** 新增带教记录请求 */
export interface CreateCoachingRequest {
  newcomerId: string;
  type: '陪访' | '一对一辅导';
  recordDate: string;
  durationHours: number;
  content: string;
  improvement?: string;
  materials?: RecordMaterial[];
}

/** 新人自助上传陪访记录请求（newcomerId 由服务端按当前用户解析） */
export interface CreateCoachingSelfRequest {
  type: '拜访' | '带教陪访';
  recordDate: string;
  durationHours: number;
  content: string;
  improvement?: string;
  materials?: RecordMaterial[];
}

/** 复盘记录 */
export interface ReviewRecord {
  id: string;
  type: '赢单复盘' | '输单复盘' | '案例分享';
  opportunity: string;
  summary: string;
  lessons: string;
  sharerId: string | null;
  sharerName: string;
  recordDate: string;
  materials: RecordMaterial[];
}

/** 复盘记录列表查询 */
export interface ReviewListQuery {
  type?: string;
  startDate?: string;
  endDate?: string;
  offset?: number;
  pageSize?: number;
}

/** 新增复盘记录请求 */
export interface CreateReviewRequest {
  newcomerId: string;
  type: '赢单复盘' | '输单复盘' | '案例分享';
  opportunity: string;
  summary: string;
  lessons: string;
  recordDate: string;
  materials?: RecordMaterial[];
}
