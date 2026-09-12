import { axiosForBackend } from '@/lib/http';
import type { AxiosResponse } from 'axios';
import type {
  CreateKbItemRequest,
  KbItemListResponse,
} from '@shared/api.interface';

/** 获取销售知识库条目列表 */
export async function listKbItems(): Promise<KbItemListResponse> {
  const response: AxiosResponse<KbItemListResponse> = await axiosForBackend({
    url: '/api/kb-items',
    method: 'GET',
  });
  return response.data;
}

/** 新增销售知识库条目（仅管理员） */
export async function createKbItem(
  payload: CreateKbItemRequest,
): Promise<{ id: string }> {
  const response: AxiosResponse<{ id: string }> = await axiosForBackend({
    url: '/api/kb-items',
    method: 'POST',
    data: payload,
  });
  return response.data;
}

/** 删除销售知识库条目（仅管理员） */
export async function deleteKbItem(itemId: string): Promise<void> {
  await axiosForBackend({
    url: `/api/kb-items/${itemId}`,
    method: 'DELETE',
  });
}
