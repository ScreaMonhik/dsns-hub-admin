import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCan } from '../hooks/useCan';
import { hasAccessToken } from '../utils/authStorage';

export const ProtectedRoute = () => {
  const { isAuthenticated } = useAuthStore();
  const { isAtLeastAdmin } = useCan();

  if (!isAuthenticated || !hasAccessToken()) {
    return <Navigate to="/login" replace />;
  }

  if (!isAtLeastAdmin) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
