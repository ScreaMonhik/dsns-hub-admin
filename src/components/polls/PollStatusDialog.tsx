import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, CircularProgress, Alert } from '@mui/material';
import { useState } from 'react';
import { pollsApi, PollStatus, type Poll } from '../../api/pollsApi';

interface Props {
  open: boolean;
  poll: Poll | null;
  targetStatus: PollStatus;
  onClose: () => void;
  onSuccess: () => void;
}

export const PollStatusDialog = ({ open, poll, targetStatus, onClose, onSuccess }: Props) => {
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleUpdateStatus = async () => {
    if (!poll) return;
    try {
      setLoading(true);
      setApiError(null);
      await pollsApi.updatePoll(poll.id, { status: targetStatus });
      onSuccess();
      onClose();
    } catch (error: any) {
      setApiError(error.response?.data?.message || 'Помилка зміни статусу');
    } finally {
      setLoading(false);
    }
  };

  const getDialogContent = () => {
    switch (targetStatus) {
      case PollStatus.PUBLISHED:
        return { title: 'Опублікувати опитування?', text: 'Воно стане доступним для голосування у вибраних підрозділах.', color: 'success' as const, btnText: 'Опублікувати' };
      case PollStatus.DRAFT:
        return { title: 'Перенести в чернетки?', text: 'Опитування буде приховано. Ви зможете його відредагувати.', color: 'primary' as const, btnText: 'В чернетки' };
      case PollStatus.ARCHIVED:
        return { title: 'Архівувати опитування?', text: 'Опитування буде закрито і перенесено в архів.', color: 'warning' as const, btnText: 'В архів' };
      default:
        return { title: 'Змінити статус', text: '', color: 'primary' as const, btnText: 'Підтвердити' };
    }
  };

  const config = getDialogContent();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{config.title}</DialogTitle>
      <DialogContent dividers>
        {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}
        <DialogContentText>{config.text} (<strong>{poll?.title}</strong>)</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Скасувати</Button>
        <Button onClick={handleUpdateStatus} variant="contained" color={config.color} disabled={loading}>
          {loading ? <CircularProgress size={24} color="inherit" /> : config.btnText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};