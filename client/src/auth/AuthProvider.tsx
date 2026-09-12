import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { axiosForBackend } from '@/lib/http';

export interface AuthUser {
  userId: string;
  username: string;
  displayName: string;
  roleKeys: string[];
  permissions: Array<{ action: string; subject: string }>;
  mustChangePassword: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  ability: { can: (action: string, subject: string) => boolean };
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string | undefined, newPassword: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await axiosForBackend.get<AuthUser>('/api/auth/me');
      setUser(response.data);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (username: string, password: string) => {
    const response = await axiosForBackend.post<{ user: AuthUser }>('/api/auth/login', { username, password });
    setUser(response.data.user);
  }, []);

  const logout = useCallback(async () => {
    await axiosForBackend.post('/api/auth/logout');
    setUser(null);
  }, []);

  const changePassword = useCallback(async (currentPassword: string | undefined, newPassword: string) => {
    await axiosForBackend.post('/api/auth/change-password', { currentPassword, newPassword });
    await refresh();
  }, [refresh]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoading,
    ability: {
      can: (action, subject) => Boolean(user?.permissions.some((permission) => permission.action === action && permission.subject === subject)),
    },
    login,
    logout,
    changePassword,
    refresh,
  }), [changePassword, isLoading, login, logout, refresh, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

export function useCan(action: string, subject: string) {
  const { ability, isLoading } = useAuth();
  return { allowed: ability.can(action, subject), isLoading };
}

export function Can({ action, subject, fallback = null, children }: {
  action: string;
  subject: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { allowed, isLoading } = useCan(action, subject);
  if (isLoading || !allowed) return <>{fallback}</>;
  return <>{children}</>;
}

export function useCurrentUserProfile() {
  const { user } = useAuth();
  return user ? {
    user_id: user.userId,
    name: user.displayName,
    email: user.username,
    avatar: '',
  } : null;
}
