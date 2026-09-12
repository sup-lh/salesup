import { axiosForBackend } from '@/lib/http';
import type { AxiosResponse } from 'axios';
import type {
  ChallengeFilter,
  ChallengeRecordsResponse,
  ChallengeTaskListResponse,
  TaskCancelCheckinResponse,
  TaskCheckinRequest,
  TaskCheckinResponse,
  CreateChallengeTaskRequest,
  UpdateChallengeTaskRequest,
  WorkbenchResponse,
} from '@shared/api.interface';

/** 获取 90 天闯关任务（按四阶段分组，filter 可选 today/pending/done；growth_admin 可传 newcomerId 查任意新人） */
export async function getChallengeRecords(
  filter?: ChallengeFilter,
  newcomerId?: string,
): Promise<ChallengeRecordsResponse> {
  const params: Record<string, string> = {};
  if (filter) params.filter = filter;
  const response: AxiosResponse<ChallengeRecordsResponse> =
    await axiosForBackend({
      url: newcomerId
        ? `/api/challenge-records/admin/${newcomerId}`
        : '/api/challenge-records',
      method: 'GET',
      params: filter ? { filter } : undefined,
    });
  return response.data;
}

/** 任务打卡 */
export async function checkinTask(
  payload: TaskCheckinRequest,
): Promise<TaskCheckinResponse> {
  const response: AxiosResponse<TaskCheckinResponse> =
    await axiosForBackend({
      url: '/api/task-records',
      method: 'POST',
      data: payload,
    });
  return response.data;
}

/** 取消任务打卡（仅限本人的任务记录） */
export async function cancelCheckin(
  recordId: string,
): Promise<TaskCancelCheckinResponse> {
  const response: AxiosResponse<TaskCancelCheckinResponse> =
    await axiosForBackend({
      url: `/api/task-records/${recordId}/cancel`,
      method: 'POST',
    });
  return response.data;
}

/** 获取闯关任务模板（仅管理员） */
export async function getTaskTemplates(): Promise<ChallengeTaskListResponse> {
  const response: AxiosResponse<ChallengeTaskListResponse> =
    await axiosForBackend({
      url: '/api/challenge-tasks',
      method: 'GET',
    });
  return response.data;
}

/** 更新闯关任务模板（仅管理员） */
export async function updateTaskTemplate(
  taskId: string,
  payload: UpdateChallengeTaskRequest,
): Promise<void> {
  const response: AxiosResponse<void> = await axiosForBackend({
    url: `/api/challenge-tasks/${taskId}`,
    method: 'PATCH',
    data: payload,
  });
  return response.data;
}

/** 删除闯关任务模板（连同打卡记录一起清理，仅管理员） */
export async function deleteTaskTemplate(taskId: string): Promise<void> {
  await axiosForBackend({
    url: `/api/challenge-tasks/${taskId}`,
    method: 'DELETE',
  });
}

/** 新增闯关任务模板（同时为存量新人补建打卡记录） */
export async function createTaskTemplate(
  payload: CreateChallengeTaskRequest,
): Promise<{ id: string }> {
  const response: AxiosResponse<{ id: string }> = await axiosForBackend({
    url: '/api/challenge-tasks',
    method: 'POST',
    data: payload,
  });
  return response.data;
}

/** 新人成长工作台聚合数据（growth_admin 可传 newcomerId 查任意新人档案） */
export async function getWorkbench(
  newcomerId?: string,
): Promise<WorkbenchResponse> {
  const response: AxiosResponse<WorkbenchResponse> = await axiosForBackend({
    url: newcomerId ? `/api/workbench/admin/${newcomerId}` : '/api/workbench',
    method: 'GET',
  });
  return response.data;
}
