import { axiosForBackend } from '@/lib/http';

export type AccountType = 'local';
export interface LocalUserInfo {
  userID: string;
  name: { zh_cn: string };
  avatar?: { image: { large: string } };
  email?: string;
  userType: '_employee';
}
export interface SearchUsersParams { query?: string; pageSize?: number; page?: number }
export interface SearchUsersResponse { data: { userList: LocalUserInfo[]; total: number } }
export interface BatchGetUsersResponse { data: { userInfoMap: Record<string, LocalUserInfo> } }
export type SearchAvatar = { avatar?: { image: { large: string } } };

interface DirectoryResponse {
  items: Array<{ id: string; displayName: string; avatarUrl: string | null; email: string | null }>;
  total: number;
}

function toUser(item: DirectoryResponse['items'][number]): LocalUserInfo {
  return {
    userID: item.id,
    name: { zh_cn: item.displayName },
    avatar: item.avatarUrl ? { image: { large: item.avatarUrl } } : undefined,
    email: item.email ?? undefined,
    userType: '_employee',
  };
}

export async function searchUsers(params: SearchUsersParams): Promise<SearchUsersResponse> {
  const { data } = await axiosForBackend.get<DirectoryResponse>('/api/directory/users', {
    params: { q: params.query, page: params.page ?? 1, pageSize: params.pageSize ?? 20 },
  });
  return { data: { userList: data.items.map(toUser), total: data.total } };
}

export async function listUsersByIds(userIds: string[]): Promise<BatchGetUsersResponse> {
  if (userIds.length === 0) return { data: { userInfoMap: {} } };
  const { data } = await axiosForBackend.get<DirectoryResponse>('/api/directory/users', {
    params: { ids: [...new Set(userIds)].join(',') },
  });
  const userInfoMap: Record<string, LocalUserInfo> = {};
  data.items.forEach((item) => {
    userInfoMap[item.id] = toUser(item);
  });
  return { data: { userInfoMap } };
}
