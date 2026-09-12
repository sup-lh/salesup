import { axiosForBackend } from '@/lib/http';
import { logger } from '@/lib/logger';
import { ensureNotForbidden } from '@client/src/utils/api-error';
import type {
   CreateAssessmentRequest,
  CreateNewcomerApplicationRequest,
  CreateNewcomerByUserRequest,
  CreateNewcomerRequest,
  DefenseApplicationItem,
  DefenseOverviewResponse,
  DefensePrerequisiteStatus,
  GrowthStage,
  NewcomerApplicationItem,
  NewcomerApplicationListResponse,
  NewcomerDetail,
  NewcomerListQuery,
  NewcomerSummary,
  PagedResult,
  UpdateNewcomerRequest,
} from '@shared/api.interface';

export interface CreateNewcomerResponse {
  id: string;
  stage: GrowthStage;
  dayCount: number;
}

/** 新人列表（后端分页 + 筛选） */
export async function fetchNewcomers(
  query: NewcomerListQuery,
): Promise<PagedResult<NewcomerSummary>> {
  try {
    const response = await axiosForBackend.get<PagedResult<NewcomerSummary>>(
      '/api/newcomers',
      {
        params: {
          keyword: query.keyword ?? '',
          stage: query.stage ?? '',
          assessmentStatus: query.assessmentStatus ?? '',
          offset: query.offset ?? 0,
          pageSize: query.pageSize ?? 20,
        },
      },
    );
    ensureNotForbidden(response);
    return response.data;
  } catch (error) {
    logger.error('获取新人列表失败', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/** 新人档案详情 */
export async function fetchNewcomerDetail(id: string): Promise<NewcomerDetail> {
  try {
    const response = await axiosForBackend.get<NewcomerDetail>(
      `/api/newcomers/${id}`,
    );
    ensureNotForbidden(response);
    return response.data;
  } catch (error) {
    logger.error('获取新人详情失败', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/** 新建新人档案（服务端会同步生成闯关任务记录） */
export async function createNewcomer(
  payload: CreateNewcomerRequest,
): Promise<CreateNewcomerResponse> {
  try {
    const response = await axiosForBackend.post<CreateNewcomerResponse>(
      '/api/newcomers',
      payload,
    );
    ensureNotForbidden(response);
    return response.data;
  } catch (error) {
    logger.error('新建新人失败', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export interface CreateNewcomerByUserResponse {
  id: string;
  name: string;
  stage: GrowthStage;
  dayCount: number;
}

/** 管理员按人员新建新人档案（绑定所选账号，同步生成闯关任务记录） */
export async function createNewcomerAdmin(
  payload: CreateNewcomerByUserRequest,
): Promise<CreateNewcomerByUserResponse> {
  try {
    const response = await axiosForBackend.post<CreateNewcomerByUserResponse>(
      '/api/newcomers/admin',
      payload,
    );
    ensureNotForbidden(response);
    return response.data;
  } catch (error) {
    logger.error('按人员新建新人失败', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/** 更新新人档案（仅提交明确提供的字段） */
export async function updateNewcomer(
  id: string,
  payload: UpdateNewcomerRequest,
): Promise<{ id: string }> {
  try {
    const response = await axiosForBackend.patch<{ id: string }>(
      `/api/newcomers/${id}`,
      payload,
    );
    ensureNotForbidden(response);
    return response.data;
  } catch (error) {
    logger.error('更新新人失败', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/** 删除新人档案（连同闯关/学习/考核/带教/复盘记录一并删除） */
export async function deleteNewcomer(id: string): Promise<void> {
  try {
    const response = await axiosForBackend.delete(`/api/newcomers/${id}`);
    ensureNotForbidden(response);
  } catch (error) {
    logger.error('删除新人档案失败', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/** 提交节点考核留档 */
export async function createAssessment(
  payload: CreateAssessmentRequest,
): Promise<{ id: string }> {
  try {
    const response = await axiosForBackend.post<{ id: string }>(
      '/api/assessment-records',
      payload,
    );
    ensureNotForbidden(response);
    return response.data;
  } catch (error) {
    logger.error('提交节点考核失败', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/** 提交新人入职申请（申请人由服务端从登录态写入） */
export async function submitNewcomerApplication(
  payload: CreateNewcomerApplicationRequest,
): Promise<{ id: string }> {
  try {
    const response = await axiosForBackend.post<{ id: string }>(
      '/api/newcomer-applications',
      payload,
    );
    ensureNotForbidden(response);
    return response.data;
  } catch (error) {
    logger.error('提交入职申请失败', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/** 入职申请列表（含历史记录与待处理数量） */
export async function fetchNewcomerApplications(): Promise<NewcomerApplicationListResponse> {
  try {
    const response = await axiosForBackend.get<NewcomerApplicationListResponse>(
      '/api/newcomer-applications',
    );
    ensureNotForbidden(response);
    return response.data;
  } catch (error) {
    logger.error('获取入职申请列表失败', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/** 当前用户的入职申请（无申请时 item 为 null） */
export async function fetchMyNewcomerApplication(): Promise<{
  item: NewcomerApplicationItem | null;
}> {
  try {
    const response = await axiosForBackend.get<{
      item: NewcomerApplicationItem | null;
    }>('/api/newcomer-applications/mine');
    ensureNotForbidden(response);
    return response.data;
  } catch (error) {
    logger.error('获取我的入职申请失败', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/** 通过入职申请（自动录入新人档案） */
export async function approveNewcomerApplication(
  applicationId: string,
): Promise<{ newcomerId: string }> {
  try {
    const response = await axiosForBackend.patch<{ newcomerId: string }>(
      `/api/newcomer-applications/${applicationId}/approve`,
    );
    ensureNotForbidden(response);
    return response.data;
  } catch (error) {
    logger.error('通过入职申请失败', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/** 转正答辩概览（所有在培新人的答辩就绪状态） */
export async function fetchDefenseOverview(): Promise<DefenseOverviewResponse> {
  try {
    const response = await axiosForBackend.get<DefenseOverviewResponse>(
      '/api/newcomers/defense-admin/overview',
    );
    ensureNotForbidden(response);
    return response.data;
  } catch (error) {
    logger.error('获取转正答辩概览失败', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

  /** 查询转正面试前置条件状态 */
  export async function fetchDefenseEligibility(
    newcomerId: string,
  ): Promise<DefensePrerequisiteStatus> {
    try {
      const response = await axiosForBackend.get<DefensePrerequisiteStatus>(
        `/api/defense/eligibility/${newcomerId}`,
      );
      ensureNotForbidden(response);
      return response.data;
    } catch (error) {
      logger.error('获取转正面试前置条件失败', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /** 提交转正面试申请 */
  export async function applyForDefense(
    newcomerId: string,
  ): Promise<{ id: string }> {
    try {
      const response = await axiosForBackend.post<{ id: string }>(
        '/api/defense/apply',
        { newcomerId },
      );
      ensureNotForbidden(response);
      return response.data;
    } catch (error) {
      logger.error('提交转正面试申请失败', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

/** 拒绝入职申请（可附拒绝理由） */
export async function rejectNewcomerApplication(
  applicationId: string,
  comment?: string,
): Promise<{ id: string }> {
  try {
    const response = await axiosForBackend.patch<{ id: string }>(
      `/api/newcomer-applications/${applicationId}/reject`,
      { comment },
    );
    ensureNotForbidden(response);
    return response.data;
  } catch (error) {
    logger.error('拒绝入职申请失败', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/** GET /api/defense/admin/applications — 获取转正面试申请列表（管理侧） */
export async function fetchDefenseApplications(): Promise<DefenseApplicationItem[]> {
  try {
    const response = await axiosForBackend.get<DefenseApplicationItem[]>(
      '/api/defense/admin/applications',
    );
    ensureNotForbidden(response);
    return response.data;
  } catch (error) {
    logger.error('[defense] fetchDefenseApplications failed', error);
    throw error;
  }
}

/** PATCH /api/defense/admin/applications/:id — 审核转正面试申请 */
export async function reviewDefenseApplication(
  id: string,
  status: 'scheduled' | 'approved' | 'rejected',
  comment?: string,
): Promise<void> {
  try {
    const response = await axiosForBackend.patch<void>(
      `/api/defense/admin/applications/${encodeURIComponent(id)}`,
      { status, comment },
    );
    ensureNotForbidden(response);
  } catch (error) {
    logger.error('[defense] reviewDefenseApplication failed', error);
    throw error;
  }
}
