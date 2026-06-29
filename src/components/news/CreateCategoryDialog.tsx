import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Alert, Box } from '@mui/material';
import { useState } from 'react';
import { newsApi } from '../../api/newsApi';

const categorySchema = z.object({
  name: z.string().min(2, 'Мінімум 2 символи'),
});

type FormInputs = z.infer<typeof categorySchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (newCategoryId: string) => void;
}

export const CreateCategoryDialog = ({ open, onClose, onSuccess }: Props) => {
  const [apiError, setApiError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormInputs>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '' },
  });

  const onSubmit = async (data: FormInputs) => {
    try {
      setApiError(null);
      const newCategory = await newsApi.createCategory(data.name);
      reset();
      onSuccess(newCategory.id);
      onClose();
    } catch (error: any) {
      setApiError(error.response?.data?.message || 'Не вдалося створити категорію');
    }
  };

  const handleClose = () => {
    reset();
    setApiError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Створити нову категорію</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers>
          {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}
          <TextField
            {...register('name')}
            label="Назва категорії"
            error={!!errors.name}
            helperText={errors.name?.message}
            fullWidth
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isSubmitting}>Скасувати</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Створення...' : 'Створити'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};