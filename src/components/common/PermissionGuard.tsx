import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useCan, type Role } from '../../hooks/useCan';

interface PermissionGuardProps {
  require: Role | Role[];
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

export const PermissionGuard = ({ require, children, fallback = null, redirectTo }: PermissionGuardProps) => {
  const { can } = useCan();

  if (!can(require)) {
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }
    return fallback;
  }

  return <>{children}</>;
};