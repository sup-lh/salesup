import { logger } from '@/lib/logger';
import { axiosForBackend } from '@/lib/http';
import type {
  ForceRoleDTO,
  RoleMemberDTO,
  MemberType,
  SearchResponse,
  PermissionItem,
  RolePermissionMapping,
  BatchUpdateRoleMappingsRequest,
  CreateRoleRequest,
  UpdateRoleRequest,
  AddMembersRequest,
  RemoveMembersRequest,
  SearchMembersRequest,
} from '@shared/api.interface';

/** 403 不会进 axios catch（平台实例不按非 2xx 拒绝），必须在 response 层面判断 */
const NO_PERMISSION_MESSAGE = '无操作权限，请联系管理员分配角色';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions {
  url: string;
  method: HttpMethod;
  data?: unknown;
  params?: Record<string, string | number | undefined>;
}

/** 统一请求入口：response 层面拦截 403 并转为业务错误 */
async function request<T>(options: RequestOptions): Promise<T> {
  const { url, method, data, params } = options;
  try {
    const response = await axiosForBackend({ url, method, data, params });
    if (response.status === 403) {
      throw new Error(NO_PERMISSION_MESSAGE);
    }
    return response.data as T;
  } catch (error) {
    logger.error(`[roleManager] 请求失败: ${method} ${url}`, error);
    throw error;
  }
}

/** 创建角色接口的返回结构 */
export interface CreateRoleResponseData {
  bizID: string;
  apiID: string;
}

/** GET /api/role_manager/roles/:bizID/members 的查询参数 */
export interface ListMembersQuery {
  type?: MemberType;
  page?: number;
  pageSize?: number;
}

/** GET /api/role_manager/roles/:bizID/members 的返回结构 */
export interface ListMembersResponse {
  members: RoleMemberDTO;
  total: number;
  hasMore: boolean;
}

/** 角色列表（含成员摘要） */
export async function getRoles(): Promise<ForceRoleDTO[]> {
  return request<ForceRoleDTO[]>({
    url: '/api/role_manager/roles',
    method: 'GET',
  });
}

/** 获取单个角色详情（含完整成员信息） */
export async function getRole(bizID: string): Promise<ForceRoleDTO> {
  return request<ForceRoleDTO>({
    url: `/api/role_manager/roles/${encodeURIComponent(bizID)}`,
    method: 'GET',
  });
}

/** 创建角色 */
export async function createRole(body: CreateRoleRequest): Promise<CreateRoleResponseData> {
  return request<CreateRoleResponseData>({
    url: '/api/role_manager/roles',
    method: 'POST',
    data: body,
  });
}

/** 更新角色信息 */
export async function updateRole(bizID: string, body: UpdateRoleRequest): Promise<void> {
  await request<unknown>({
    url: `/api/role_manager/roles/${encodeURIComponent(bizID)}`,
    method: 'PUT',
    data: body,
  });
}

/** 删除角色 */
export async function deleteRole(bizID: string): Promise<void> {
  await request<unknown>({
    url: `/api/role_manager/roles/${encodeURIComponent(bizID)}`,
    method: 'DELETE',
  });
}

/** 分页查询角色成员（仅用于成员编辑弹窗的分页加载） */
export async function listRoleMembers(
  bizID: string,
  query: ListMembersQuery = {},
): Promise<ListMembersResponse> {
  return request<ListMembersResponse>({
    url: `/api/role_manager/roles/${encodeURIComponent(bizID)}/members`,
    method: 'GET',
    params: { type: query.type, page: query.page, pageSize: query.pageSize },
  });
}

/** 添加角色成员 */
export async function addRoleMembers(bizID: string, body: AddMembersRequest): Promise<void> {
  await request<unknown>({
    url: `/api/role_manager/roles/${encodeURIComponent(bizID)}/members`,
    method: 'POST',
    data: body,
  });
}

/** 批量移除角色成员 */
export async function removeRoleMembers(
  bizID: string,
  body: RemoveMembersRequest,
): Promise<void> {
  await request<unknown>({
    url: `/api/role_manager/roles/${encodeURIComponent(bizID)}/members/batch_remove`,
    method: 'POST',
    data: body,
  });
}

/** 清空角色成员 */
export async function clearRoleMembers(bizID: string): Promise<void> {
  await request<unknown>({
    url: `/api/role_manager/roles/${encodeURIComponent(bizID)}/members`,
    method: 'DELETE',
  });
}

/** 搜索用户/部门/群组 */
export async function searchMembers(body: SearchMembersRequest): Promise<SearchResponse> {
  return request<SearchResponse>({
    url: '/api/role_manager/search',
    method: 'POST',
    data: body,
  });
}

/** 权限点位列表 */
export async function listPermissions(): Promise<PermissionItem[]> {
  return request<PermissionItem[]>({
    url: '/api/permissions',
    method: 'GET',
  });
}

/** 角色-权限点位映射列表 */
export async function listRoleMappings(): Promise<RolePermissionMapping[]> {
  return request<RolePermissionMapping[]>({
    url: '/api/permissions/role-mappings',
    method: 'GET',
  });
}

/** 批量更新角色-权限点位映射 */
export async function batchUpdateRoleMappings(
  body: BatchUpdateRoleMappingsRequest,
): Promise<void> {
  await request<unknown>({
    url: '/api/permissions/role-mappings/batch',
    method: 'POST',
    data: body,
  });
}
