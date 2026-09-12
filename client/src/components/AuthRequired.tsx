import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '@/auth/AuthProvider';

export default function AuthRequired() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">正在加载账号信息...</div>;
  }
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }
  return <Outlet />;
}
