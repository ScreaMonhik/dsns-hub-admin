import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, CircularProgress } from '@mui/material';
import { useState } from 'react';
import { newsApi, type News } from '../../api/newsApi';

interface RestoreNewsDialogProps {
  open: boolean;
  news: News | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const RestoreNewsDialog = ({ open, news, onClose, onSuccess }: RestoreNewsDialogProps) => {
  const [loading, setLoading] = useState(false);

  const handleRestore = async () => {
    if (!news) return;
    try {
      setLoading(true);
      await newsApi.updateNews(news.id, { status: 'DRAFT' });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to restore news', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Відновити новину?</DialogTitle>
      <DialogContent dividers>
        <DialogContentText>
          Новина <strong>"{news?.title}"</strong> буде відновлена як чернетка. 
          Ви зможете знову опублікувати її пізніше.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Скасувати</Button>
        <Button onClick={handleRestore} variant="contained" color="success" disabled={loading}>
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Відновити'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};