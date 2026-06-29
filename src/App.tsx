import { useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { Login } from './pages/Login';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { ukUA } from '@mui/material/locale';
import { AdminLayout } from './components/layout/AdminLayout';
import { Users } from './pages/Users';
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
        main: '#1976d2',
      },
      background: {
        default: mode === 'light' ? '#f5f5f5' : '#121212',
        paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
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
              <Route path="/news" element={<h2>Модуль "Новини" (В розробці)</h2>} />
              <Route path="/documents" element={<h2>Модуль "Документи" (В розробці)</h2>} />
              <Route path="/projects" element={<h2>Модуль "Проєкти" (В розробці)</h2>} />
              <Route path="/polls" element={<h2>Модуль "Опитування" (В розробці)</h2>} />
              <Route path="/chats" element={<h2>Модуль "Чати" (В розробці)</h2>} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;