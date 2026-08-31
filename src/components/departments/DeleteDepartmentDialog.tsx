import { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogContentText, 
  DialogActions, Button, Alert 
} from '@mui/material';
import { departmentsApi, type Department } from '../../api/departmentsApi';

interface Props {
  open: boolean;
  department: Department | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const DeleteDepartmentDialog = ({ open, department, onClose, onSuccess }: Props) => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async () => {
    if (!department) return;
    try {
      setApiError(null);
      setIsSubmitting(true);
      await departmentsApi.deleteDepartment(department.id);
      onSuccess();
      onClose();
    } catch (error: any) {
      if (error.response?.status === 400) {
        setApiError('Неможливо видалити підрозділ, оскільки він має вкладені підрозділи або пов\'язані дані.');
      } else {
        setApiError(error.response?.data?.message || 'Не вдалося видалити підрозділ');
      }
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
          Ви впевнені, що хочете остаточно видалити підрозділ{' '}
          <strong>{department?.name}</strong>? 
          Цю дію не можна буде скасувати.
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