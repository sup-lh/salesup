export interface I18nText { [locale: string]: string }
export interface UserSimpleDTO { userID?: string; name?: I18nText; avatar?: string; email?: string }
export interface DepartmentDTO { id?: string; name?: I18nText }
export interface ChatSimpleDTO { chatID?: string; name?: I18nText; avatar?: string }
export interface RoleMemberDTO { userList?: UserSimpleDTO[]; departmentList?: DepartmentDTO[]; groupChatList?: ChatSimpleDTO[]; allEmployees?: boolean; public?: boolean; presetGroup?: { isContainsAdmin?: boolean } }
export interface ForceRoleDTO { bizID?: string; apiID?: string; name?: string; description?: string; roleMembers?: RoleMemberDTO }
export interface MemberMutationData { userList?: UserSimpleDTO[] }
export type MemberType = 'User';
export interface SearchResult { userResult?: { total?: number; items?: UserSimpleDTO[] } }
export interface SearchResponse { users?: UserSimpleDTO[]; total?: number; hasMore?: boolean }
export interface FilterParams { [key: string]: unknown }
export interface PresetGroupDTO { isContainsAdmin?: boolean }

/** 权限点位 */
export interface PermissionItem {
  id: string;
  action: string;
  subject: string;
  description: string | null;
}

/** 角色-权限点位映射 */
export interface RolePermissionMapping {
  id: string;
  roleKey: string;
  permissionId: string;
}

/** POST /api/permissions/role-mappings/batch */
export interface BatchUpdateRoleMappingsRequest {
  roleKey: string;
  add: string[];
  remove: string[];
}

/** POST /api/role_manager/roles */
export interface CreateRoleRequest {
  role: { name: string; description?: string; bizID: string };
}

/** PUT /api/role_manager/roles/:bizID */
export interface UpdateRoleRequest {
  role: { name?: string; description?: string };
}

/** POST /api/role_manager/roles/:bizID/members */
export interface AddMembersRequest {
  members: MemberMutationData;
}

/** POST /api/role_manager/roles/:bizID/members/batch_remove */
export interface RemoveMembersRequest {
  members: MemberMutationData;
}

/** POST /api/role_manager/search */
export interface SearchMembersRequest {
  query: string;
  filters?: FilterParams;
  pageSize?: number;
  page?: number;
}
