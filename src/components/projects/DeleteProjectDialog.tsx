import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Alert } from '@mui/material';
import { useState } from 'react';
import { projectsApi, type ProjectModel } from '../../api/projectsApi';

interface Props {
  open: boolean;
  project: ProjectModel | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const DeleteProjectDialog = ({ open, project, onClose, onSuccess }: Props) => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async () => {
    if (!project) return;
    try {
      setApiError(null);
      setIsSubmitting(true);
      await projectsApi.deleteProject(project.id);
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setApiError(err.response?.data?.message || 'Не вдалося видалити проєкт');
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
          Ви впевнені, що хочете остаточно видалити проєкт <strong>{project?.title}</strong>? 
          Всі коментарі та голоси також будуть втрачені. Цю дію не можна скасувати.
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