import { lazy, Suspense, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { Login } from './pages/Login';
import { Box, CircularProgress, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { ukUA } from '@mui/material/locale';
import { AdminLayout } from './components/layout/AdminLayout';
import { useThemeStore } from './store/themeStore';
import { PermissionGuard } from './components/common/PermissionGuard';

const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Users = lazy(() => import('./pages/Users').then((m) => ({ default: m.Users })));
const News = lazy(() => import('./pages/News').then((m) => ({ default: m.News })));
const Documents = lazy(() => import('./pages/Documents').then((m) => ({ default: m.Documents })));
const Projects = lazy(() => import('./pages/Projects').then((m) => ({ default: m.Projects })));
const Polls = lazy(() => import('./pages/Polls').then((m) => ({ default: m.Polls })));
const Chats = lazy(() => import('./pages/Chats').then((m) => ({ default: m.Chats })));
const AuditLogs = lazy(() => import('./pages/AuditLogs').then((m) => ({ default: m.AuditLogs })));
const Broadcasts = lazy(() => import('./pages/Broadcasts').then((m) => ({ default: m.Broadcasts })));
const Profile = lazy(() => import('./pages/Profile').then((m) => ({ default: m.Profile })));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));
const Departments = lazy(() => import('./pages/Departments').then((m) => ({ default: m.Departments })));

const PageFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
    <CircularProgress />
  </Box>
);

function App() {
  const mode = useThemeStore((state) => state.mode);

  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'light' ? '#1976d2' : '#c084fc',
      },
      background: {
        default: mode === 'light' ? '#f8fafc' : '#0f172a',
        paper: mode === 'light' ? '#ffffff' : '#1e293b',
      },
      ...(mode === 'dark' && {
        text: {
          primary: '#f8fafc',
          secondary: '#94a3b8',
        },
      }),
      divider: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.12)',
    },
    shape: {
      borderRadius: 10,
    },
    typography: {
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            ...(mode === 'dark' && {
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
            }),
          },
        },
      },
      MuiAppBar: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b',
            color: mode === 'light' ? '#0f172a' : '#f8fafc',
            borderBottom: '1px solid',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b',
            borderRight: '1px solid',
            borderTop: 'none',
            borderBottom: 'none',
            borderLeft: 'none',
            borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
          },
        },
      },
    },
  }, ukUA), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/users" element={<Users />} />
                <Route path="/news" element={<News />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/polls" element={<Polls />} />
                <Route path="/chats" element={<Chats />} />
                <Route path="/broadcasts" element={<Broadcasts />} />
                <Route path="/profile" element={<Profile />} />
                <Route
                  path="/audit-logs"
                  element={
                    <PermissionGuard require="SUPER_ADMIN" redirectTo="/">
                      <AuditLogs />
                    </PermissionGuard>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <PermissionGuard require="SUPER_ADMIN" redirectTo="/">
                      <Settings />
                    </PermissionGuard>
                  }
                />
                <Route
                  path="/departments"
                  element={
                    <PermissionGuard require="SUPER_ADMIN" redirectTo="/">
                      <Departments />
                    </PermissionGuard>
                  }
                />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
