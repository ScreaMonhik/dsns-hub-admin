import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const ProtectedRoute = () => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'ADMIN') {
    // Optionally redirect to a 403 Forbidden page, but login is safer for forced re-auth
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};