import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, CircularProgress, Alert } from '@mui/material';
import { useState } from 'react';
import { documentsApi, type DocumentModel } from '../../api/documentsApi';

type ActionType = 'publish' | 'archive' | 'unarchive';

interface Props {
  open: boolean;
  document: DocumentModel | null;
  action: ActionType | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const DocumentStatusDialog = ({ open, document, action, onClose, onSuccess }: Props) => {
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleExecute = async () => {
    if (!document || !action) return;
    try {
      setLoading(true);
      setApiError(null);
      
      if (action === 'publish') await documentsApi.publishDocument(document.id);
      if (action === 'archive') await documentsApi.archiveDocument(document.id);
      if (action === 'unarchive') await documentsApi.unarchiveDocument(document.id);
      
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setApiError(err.response?.data?.message || 'Помилка виконання дії');
    } finally {
      setLoading(false);
    }
  };

  const getDialogContent = () => {
    switch (action) {
      case 'publish': return { title: 'Опублікувати документ?', text: 'Він стане доступним для перегляду користувачам вибраних підрозділів.', btn: 'Опублікувати', color: 'success' as const };
      case 'archive': return { title: 'Архівувати документ?', text: 'Він зникне з мобільного застосунку, але залишиться в архіві адмін-панелі.', btn: 'В архів', color: 'warning' as const };
      case 'unarchive': return { title: 'Відновити з архіву?', text: 'Документ буде відновлено у статусі "Чернетка". Ви зможете його відредагувати перед повторною публікацією.', btn: 'Відновити як Чернетку', color: 'primary' as const };
      default: return { title: 'Змінити статус', text: '', btn: 'Підтвердити', color: 'primary' as const };
    }
  };

  const config = getDialogContent();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{config.title}</DialogTitle>
      <DialogContent dividers>
        {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}
        <DialogContentText>{config.text}</DialogContentText>
        {document && <DialogContentText sx={{ mt: 1, fontWeight: 'bold' }}>{document.title}</DialogContentText>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Скасувати</Button>
        <Button onClick={handleExecute} variant="contained" color={config.color} disabled={loading}>
          {loading ? <CircularProgress size={24} color="inherit" /> : config.btn}
        </Button>
      </DialogActions>
    </Dialog>
  );
};