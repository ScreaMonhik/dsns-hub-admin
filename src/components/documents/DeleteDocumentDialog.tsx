import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Alert } from '@mui/material';
import { useState } from 'react';
import { documentsApi, type DocumentModel } from '../../api/documentsApi';

interface Props {
  open: boolean;
  document: DocumentModel | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const DeleteDocumentDialog = ({ open, document, onClose, onSuccess }: Props) => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async () => {
    if (!document) return;
    try {
      setApiError(null);
      setIsSubmitting(true);
      await documentsApi.deleteDocument(document.id);
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setApiError(err.response?.data?.message || 'Не вдалося видалити документ');
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
          Ви впевнені, що хочете остаточно видалити документ <strong>{document?.title}</strong>? 
          Сам файл також буде фізично видалено. Цю дію не можна скасувати.
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