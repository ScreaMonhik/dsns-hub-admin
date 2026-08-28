import { Box, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useIdleTimer } from '../../hooks/useIdleTimer';
import { useAuthStore } from '../../store/authStore';

export const AdminLayout = () => {
  const { logout } = useAuthStore();

  useIdleTimer({
    timeout: 15 * 60 * 1000, // 15 minutes
    onIdle: () => {
      toast.error('Сесію завершено через неактивність (15 хв)', { duration: 5000 });
      logout();
    },
  });

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Header />
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar /> {/* Spacer for Header */}
        <Outlet />
      </Box>
    </Box>
  );
};