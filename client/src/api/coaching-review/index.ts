import { axiosForBackend } from '@/lib/http';
import { logger } from '@/lib/logger';
import { ensureNotForbidden } from '@client/src/utils/api-error';
import type {
  CoachingListQuery,
  CoachingRecord,
  CreateCoachingRequest,
  CreateCoachingSelfRequest,
  CreateReviewRequest,
  ReviewListQuery,
  ReviewRecord,
} from '@shared/api.interface';

/** 复盘记录（服务端附带首条赢单复盘标记，用于金色高亮置顶） */
export interface ReviewRecordItem extends ReviewRecord {
  isFirstWin?: boolean;
}

export interface CoachingListResponse {
  items: CoachingRecord[];
  total: number;
}

export interface ReviewListResponse {
  items: ReviewRecordItem[];
  total: number;
}

export interface CreateRecordResponse {
  id: string;
}

function buildParams(
  query: CoachingListQuery | ReviewListQuery,
): Record<string, string> {
  const params: Record<string, string> = {
    offset: String(query.offset ?? 0),
    pageSize: String(query.pageSize ?? 20),
  };
  if (query.type) params.type = query.type;
  if (query.startDate) params.startDate = query.startDate;
  if (query.endDate) params.endDate = query.endDate;
  return params;
}

export async function listCoachingRecords(
  query: CoachingListQuery,
): Promise<CoachingListResponse> {
  try {
    const response = await axiosForBackend.get<CoachingListResponse>(
      '/api/coaching-records',
      {
        params: buildParams(query),
      },
    );
    ensureNotForbidden(response);
    return response.data;
  } catch (error) {
    logger.error('获取带教记录列表失败', error);
    throw error;
  }
}

export async function createCoachingRecord(
  payload: CreateCoachingRequest,
): Promise<CreateRecordResponse> {
  try {
    const response = await axiosForBackend.post<CreateRecordResponse>(
      '/api/coaching-records',
      payload,
    );
    ensureNotForbidden(response);
    return response.data;
  } catch (error) {
    logger.error('新增带教记录失败', error);
    throw error;
  }
}

/** 新人自助上传陪访记录（服务端按当前用户解析档案） */
export async function createCoachingSelfRecord(
  payload: CreateCoachingSelfRequest,
): Promise<CreateRecordResponse> {
  try {
    const response = await axiosForBackend.post<CreateRecordResponse>(
      '/api/coaching-records/self',
      payload,
    );
    ensureNotForbidden(response);
    return response.data;
  } catch (error) {
    logger.error('自助上传陪访记录失败', error);
    throw error;
  }
}

export async function listReviewRecords(
  query: ReviewListQuery,
): Promise<ReviewListResponse> {
  try {
    const response = await axiosForBackend.get<ReviewListResponse>(
      '/api/review-records',
      {
        params: buildParams(query),
      },
    );
    ensureNotForbidden(response);
    return response.data;
  } catch (error) {
    logger.error('获取复盘记录列表失败', error);
    throw error;
  }
}

export async function createReviewRecord(
  payload: CreateReviewRequest,
): Promise<CreateRecordResponse> {
  try {
    const response = await axiosForBackend.post<CreateRecordResponse>(
      '/api/review-records',
      payload,
    );
    ensureNotForbidden(response);
    return response.data;
  } catch (error) {
    logger.error('新增复盘记录失败', error);
    throw error;
  }
}
