import { axiosForBackend } from '@/lib/http';

export interface AdminUser {
  id: string;
  username: string;
  email: string | null;
  displayName: string;
  status: 'active' | 'disabled';
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export async function listAdminUsers(query = ''): Promise<AdminUser[]> {
  const response = await axiosForBackend.get<AdminUser[]>('/api/admin/users', { params: { q: query || undefined } });
  return response.data;
}

export async function createAdminUser(input: { username: string; displayName: string; password: string; email?: string; roleKeys: string[] }) {
  return (await axiosForBackend.post<{ id: string }>('/api/admin/users', input)).data;
}

export async function updateAdminUser(id: string, input: { displayName?: string; email?: string; status?: 'active' | 'disabled' }) {
  return (await axiosForBackend.patch<{ ok: boolean }>(`/api/admin/users/${id}`, input)).data;
}

export async function resetAdminUserPassword(id: string, password: string) {
  return (await axiosForBackend.post<{ ok: boolean }>(`/api/admin/users/${id}/reset-password`, { password })).data;
}

export async function assignAdminUserRoles(id: string, roleKeys: string[]) {
  return (await axiosForBackend.post<{ ok: boolean }>(`/api/admin/users/${id}/roles`, { roleKeys })).data;
}
