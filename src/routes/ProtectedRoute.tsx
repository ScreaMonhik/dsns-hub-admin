import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCan } from '../hooks/useCan';

export const ProtectedRoute = () => {
  const { isAuthenticated } = useAuthStore();
  const { isAtLeastAdmin } = useCan();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAtLeastAdmin) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};