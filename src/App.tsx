import { useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { Login } from './pages/Login';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { ukUA } from '@mui/material/locale';
import { AdminLayout } from './components/layout/AdminLayout';
import { Users } from './pages/Users';
import { News } from './pages/News';
import { Polls } from './pages/Polls';
import { Chats } from './pages/Chats';
import { useThemeStore } from './store/themeStore';

const DashboardPlaceholder = () => (
  <div>
    <h1>Панель Адміністратора</h1>
    <p>Вітаємо в адмін-панелі DSNS Hub. Оберіть модуль з бокового меню.</p>
  </div>
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
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/" element={<DashboardPlaceholder />} />
              <Route path="/users" element={<Users />} />
              <Route path="/news" element={<News />} />
              <Route path="/documents" element={<h2>Модуль "Документи" (В розробці)</h2>} />
              <Route path="/projects" element={<h2>Модуль "Проєкти" (В розробці)</h2>} />
              <Route path="/polls" element={<Polls />} />
              <Route path="/chats" element={<Chats />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;