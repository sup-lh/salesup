import { isAxiosError } from 'axios';
import type { AxiosResponse } from 'axios';

/** 从后端异常中提取可展示的错误信息（优先 error.response.data.message） */
export function getApiErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (isAxiosError(error)) {
    const message: unknown = error.response?.data?.message;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }
  return fallback;
}

/** 是否为后端 404（如未匹配到当前用户的新人档案） */
export function isNotFoundApiError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 404;
}

/** 统一拦截 403（403 是正常响应不进 catch，需在响应层检查后转异常） */
export function ensureNotForbidden<T>(response: AxiosResponse<T>): AxiosResponse<T> {
  if (response.status === 403) {
    throw new Error('无操作权限，请联系管理员分配角色');
  }
  return response;
}
