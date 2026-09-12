import { axiosForBackend } from '@/lib/http';
import { logger } from '@/lib/logger';
import type { AxiosResponse } from 'axios';
import { ensureNotForbidden } from '@client/src/utils/api-error';
import type { StageCatalogItem } from '@shared/api.interface';

export interface StageOption {
  value: string;
  label: string;
}

export interface CreateStageRequest {
  code: string;
  name: string;
  startDay: number;
  endDay: number;
  hasDefense?: boolean;
  standard?: string;
}

export type UpdateStageRequest = Partial<CreateStageRequest>;

/** GET /api/stages — 获取阶段配置列表 */
export async function fetchStages(): Promise<StageCatalogItem[]> {
  try {
    const response: AxiosResponse<StageCatalogItem[]> = await axiosForBackend({
      url: '/api/stages',
      method: 'GET',
    });
    ensureNotForbidden(response);
    return response.data;
  } catch (error) {
    logger.error('[stage] fetchStages failed', error);
    throw error;
  }
}

/** POST /api/stages — 新增阶段配置 */
export async function createStage(payload: CreateStageRequest): Promise<{ id: string }> {
  try {
    const response: AxiosResponse<{ id: string }> = await axiosForBackend({
      url: '/api/stages',
      method: 'POST',
      data: payload,
    });
    ensureNotForbidden(response);
    return response.data;
  } catch (error) {
    logger.error('[stage] createStage failed', error);
    throw error;
  }
}

/** PATCH /api/stages/:id — 更新阶段配置 */
export async function updateStage(id: string, payload: UpdateStageRequest): Promise<void> {
  try {
    const response: AxiosResponse<void> = await axiosForBackend({
      url: `/api/stages/${encodeURIComponent(id)}`,
      method: 'PATCH',
      data: payload,
    });
    ensureNotForbidden(response);
  } catch (error) {
    logger.error('[stage] updateStage failed', error);
    throw error;
  }
}

/** DELETE /api/stages/:id — 删除阶段配置 */
export async function deleteStage(id: string): Promise<void> {
  try {
    const response: AxiosResponse<void> = await axiosForBackend({
      url: `/api/stages/${encodeURIComponent(id)}`,
      method: 'DELETE',
    });
    ensureNotForbidden(response);
  } catch (error) {
    logger.error('[stage] deleteStage failed', error);
    throw error;
  }
}

/** 获取阶段选项列表（用于 Select 等下拉组件） */
export async function fetchStageOptions(): Promise<StageOption[]> {
  try {
    const stages: StageCatalogItem[] = await fetchStages();
    return stages.map((s: StageCatalogItem) => ({
      value: s.code,
      label: s.name,
    }));
  } catch (error) {
    logger.error('[stage] fetchStageOptions failed', error);
    throw error;
  }
}