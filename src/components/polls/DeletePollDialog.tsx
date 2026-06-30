import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Alert } from '@mui/material';
import { useState } from 'react';
import { pollsApi, type Poll } from '../../api/pollsApi';

interface Props {
  open: boolean;
  poll: Poll | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const DeletePollDialog = ({ open, poll, onClose, onSuccess }: Props) => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async () => {
    if (!poll) return;
    try {
      setApiError(null);
      setIsSubmitting(true);
      await pollsApi.deletePoll(poll.id);
      onSuccess();
      onClose();
    } catch (error: any) {
      setApiError(error.response?.data?.message || 'Не вдалося видалити опитування');
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
          Ви впевнені, що хочете остаточно видалити опитування <strong>{poll?.title}</strong>? 
          Всі голоси користувачів будуть втрачені. Цю дію не можна скасувати.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>Скасувати</Button>
        <Button onClick={handleDelete} variant="contained" color="error" disabled={isSubmitting}>
          {isSubmitting ? 'Видалення...' : 'Видалити'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};