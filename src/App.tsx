import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { Login } from './pages/Login';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';

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
  <div style={{ padding: '2rem' }}>
    <h1>Admin Dashboard</h1>
    <p>Welcome to the DSNS Hub Admin Panel.</p>
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
            <Route path="/" element={<DashboardPlaceholder />} />
            {/* Future routes: /news, /documents, /users, etc. will go here */}
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;