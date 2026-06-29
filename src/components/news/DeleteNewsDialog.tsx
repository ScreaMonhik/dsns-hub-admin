import { 
  Dialog, DialogTitle, DialogContent, DialogContentText, 
  DialogActions, Button, Alert 
} from '@mui/material';
import { useState } from 'react';
import { newsApi, type News } from '../../api/newsApi';

interface Props {
  open: boolean;
  news: News | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const DeleteNewsDialog = ({ open, news, onClose, onSuccess }: Props) => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async () => {
    if (!news) return;
    try {
      setApiError(null);
      setIsSubmitting(true);
      await newsApi.deleteNews(news.id);
      onSuccess();
      onClose();
    } catch (error: any) {
      setApiError(error.response?.data?.message || 'Не вдалося видалити новину');
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
          Ви впевнені, що хочете остаточно видалити новину{' '}
          <strong>{news?.title}</strong>? 
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