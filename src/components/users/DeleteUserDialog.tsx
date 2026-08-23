import { 
  Dialog, DialogTitle, DialogContent, DialogContentText, 
  DialogActions, Button, Alert 
} from '@mui/material';
import { useState } from 'react';
import { usersApi } from '../../api/usersApi';
import type { User } from '../../store/authStore';

interface Props {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const DeleteUserDialog = ({ open, user, onClose, onSuccess }: Props) => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async () => {
    if (!user) return;
    try {
      setApiError(null);
      setIsSubmitting(true);
      await usersApi.deleteUser(user.id);
      onSuccess();
      onClose();
    } catch (error: any) {
      setApiError(error.response?.data?.message || 'Не вдалося видалити користувача');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Підтвердження видалення</DialogTitle>
      <DialogContent dividers>
        {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}
        <DialogContentText>
          Ви впевнені, що хочете остаточно видалити користувача{' '}
          <strong>{user?.firstName} {user?.lastName}</strong> ({user?.email})? 
          Цю дію не можна буде скасувати.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Скасувати
        </Button>
        <Button 
          onClick={handleDelete} 
          variant="contained" 
          color="error" 
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Видалення...' : 'Видалити'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};