import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { Login } from './pages/Login';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { AdminLayout } from './components/layout/AdminLayout';
import { Users } from './pages/Users';

// Temporary basic theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

const DashboardPlaceholder = () => (
  <div>
    <h1>Admin Dashboard</h1>
    <p>Welcome to the DSNS Hub Admin Panel. Select a module from the sidebar.</p>
  </div>
);

function App() {
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
              <Route path="/news" element={<h2>News Module (WIP)</h2>} />
              <Route path="/documents" element={<h2>Documents Module (WIP)</h2>} />
              <Route path="/projects" element={<h2>Projects Module (WIP)</h2>} />
              <Route path="/polls" element={<h2>Polls Module (WIP)</h2>} />
              <Route path="/chats" element={<h2>Chats Module (WIP)</h2>} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;