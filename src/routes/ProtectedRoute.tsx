import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCan } from '../hooks/useCan';
import { hasAccessToken } from '../utils/authStorage';

export const ProtectedRoute = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { isAtLeastAdmin } = useCan();
  const location = useLocation();

  if (!isAuthenticated || !hasAccessToken()) {
    return <Navigate to="/login" replace />;
  }

  if (!isAtLeastAdmin) {
    return <Navigate to="/login" replace />;
  }

  if (user?.forcePasswordChange && !location.pathname.startsWith('/profile')) {
    return <Navigate to="/profile" replace />;
  }

  return <Outlet />;
};
