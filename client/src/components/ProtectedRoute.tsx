import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';

interface PermissionRequirement {
  action: string;
  subject: string;
}

interface ProtectedRouteProps {
  requiredPermissions: PermissionRequirement[];
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requiredPermissions,
  children,
}) => {
  const { ability, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
        <div className="h-24 w-full animate-pulse rounded-xl bg-muted" />
        <div className="h-36 w-full animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  const hasPermission = requiredPermissions.every(
    (permission: PermissionRequirement) =>
      ability.can(permission.action, permission.subject),
  );

  if (!hasPermission) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
