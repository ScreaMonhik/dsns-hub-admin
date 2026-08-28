import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RefreshIcon from '@mui/icons-material/Refresh';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught application error:', error, errorInfo);
  }

  private handleReset = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'background.default', p: 3 }}>
          <Paper sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 500, textAlign: 'center' }}>
            <WarningAmberIcon color="error" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
              Виникла непередбачувана помилка
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Ми вже зафіксували проблему. Спробуйте оновити сторінку або повернутися пізніше.
            </Typography>
            <Button variant="contained" startIcon={<RefreshIcon />} onClick={this.handleReset}>
              Оновити сторінку
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}