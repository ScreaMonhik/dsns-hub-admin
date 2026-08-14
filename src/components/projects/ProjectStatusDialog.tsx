import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, CircularProgress, Alert } from '@mui/material';
import { useState } from 'react';
import { projectsApi, type ProjectModel } from '../../api/projectsApi';

type ActionType = 'publish' | 'archive' | 'unarchive';

interface Props {
  open: boolean;
  project: ProjectModel | null;
  action: ActionType | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProjectStatusDialog = ({ open, project, action, onClose, onSuccess }: Props) => {
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleExecute = async () => {
    if (!project || !action) return;
    try {
      setLoading(true);
      setApiError(null);
      
      if (action === 'publish') await projectsApi.publishProject(project.id);
      if (action === 'archive') await projectsApi.archiveProject(project.id);
      if (action === 'unarchive') await projectsApi.unarchiveProject(project.id);
      
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
      case 'publish': return { title: 'Опублікувати проєкт?', text: 'Він стане доступним для перегляду, коментування та голосування користувачам.', btn: 'Опублікувати', color: 'success' as const };
      case 'archive': return { title: 'Архівувати проєкт?', text: 'Він зникне з активної стрічки застосунку, голосування та коментування будуть припинені.', btn: 'В архів', color: 'warning' as const };
      case 'unarchive': return { title: 'Відновити з архіву?', text: 'Проєкт буде відновлено у статусі "Чернетка".', btn: 'Відновити як Чернетку', color: 'primary' as const };
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
        {project && <DialogContentText sx={{ mt: 1, fontWeight: 'bold' }}>{project.title}</DialogContentText>}
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