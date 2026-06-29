import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, CircularProgress } from '@mui/material';
import { useState } from 'react';
import { newsApi, type News } from '../../api/newsApi';

interface ArchiveNewsDialogProps {
  open: boolean;
  news: News | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ArchiveNewsDialog = ({ open, news, onClose, onSuccess }: ArchiveNewsDialogProps) => {
  const [loading, setLoading] = useState(false);

  const handleArchive = async () => {
    if (!news) return;
    try {
      setLoading(true);
      await newsApi.updateNews(news.id, { status: 'ARCHIVED' });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to archive news', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Архівувати новину?</DialogTitle>
      <DialogContent dividers>
        <DialogContentText>
          Ви впевнені, що хочете перемістити новину <strong>"{news?.title}"</strong> в архів? 
          Вона перестане відображатися в мобільному додатку.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Скасувати</Button>
        <Button onClick={handleArchive} variant="contained" color="warning" disabled={loading}>
          {loading ? <CircularProgress size={24} color="inherit" /> : 'В архів'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};