import { AxiosResponse } from 'axios';
import { axiosForBackend } from '@/lib/http';
import { logger } from '@/lib/logger';
import type {
  CreateOpportunitySelfRequest,
  OpportunitySelfSummaryResponse,
} from '@shared/api.interface';

/** 新人商机摘要（数量 + 最近几条） */
export async function getOpportunitySelfSummary(): Promise<OpportunitySelfSummaryResponse> {
  const response: AxiosResponse<OpportunitySelfSummaryResponse> =
    await axiosForBackend({
      url: '/api/opportunities/self',
      method: 'GET',
    });
  return response.data;
}

/** 新人自助上传商机 */
export async function createOpportunitySelf(
  payload: CreateOpportunitySelfRequest,
): Promise<{ id: string }> {
  try {
    const response: AxiosResponse<{ id: string }> = await axiosForBackend({
      url: '/api/opportunities/self',
      method: 'POST',
      data: payload,
    });
    return response.data;
  } catch (error) {
    logger.error('自助上传商机失败', error);
    throw error;
  }
}
