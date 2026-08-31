import { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, 
  Button, Box, Alert, IconButton, Typography, InputAdornment, OutlinedInput 
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import { usersApi } from '../../api/usersApi';
import type { User } from '../../store/authStore';

interface Props {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ResetPasswordDialog = ({ open, user, onClose, onSuccess }: Props) => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleReset = async () => {
    if (!user) return;
    try {
      setIsSubmitting(true);
      setApiError(null);
      const response = await usersApi.resetPassword(user.id);
      setTempPassword(response.tempPassword);
      onSuccess();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setApiError(err.response?.data?.message || 'Не вдалося скинути пароль');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setApiError(null);
    setTempPassword(null);
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Скидання пароля</DialogTitle>
      <DialogContent dividers>
        {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}
        
        {!tempPassword ? (
          <DialogContentText>
            Ви впевнені, що хочете скинути пароль для користувача <strong>{user?.email}</strong>? 
            Система автоматично згенерує новий безпечний тимчасовий пароль.
          </DialogContentText>
        ) : (
          <Box>
            <Alert severity="success" sx={{ mb: 3 }}>
              Пароль успішно скинуто! Обов'язково скопіюйте його та передайте користувачу для входу.
            </Alert>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              Тимчасовий пароль:
            </Typography>
            <OutlinedInput
              fullWidth
              readOnly
              value={tempPassword}
              sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton 
                    onClick={handleCopy} 
                    edge="end" 
                    color={copied ? "success" : "primary"}
                    title="Копіювати в буфер обміну"
                  >
                    {copied ? <CheckIcon /> : <ContentCopyIcon />}
                  </IconButton>
                </InputAdornment>
              }
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {!tempPassword ? (
          <>
            <Button onClick={handleClose} disabled={isSubmitting}>Скасувати</Button>
            <Button onClick={handleReset} variant="contained" color="warning" disabled={isSubmitting}>
              {isSubmitting ? 'Скидання...' : 'Скинути пароль'}
            </Button>
          </>
        ) : (
          <Button onClick={handleClose} variant="contained">Закрити</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};