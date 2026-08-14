import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Box, Alert 
} from '@mui/material';
import { useState } from 'react';
import { usersApi } from '../../api/usersApi';
import type { User } from '../../store/authStore';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const resetPasswordSchema = z.object({
  newPassword: z.string().regex(passwordRegex, 'Мінімум 8 символів. Обов\'язково: велика і мала літери, цифра, спецсимвол.'),
});

type FormInputs = z.infer<typeof resetPasswordSchema>;

interface Props {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ResetPasswordDialog = ({ open, user, onClose, onSuccess }: Props) => {
  const [apiError, setApiError] = useState<string | null>(null);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormInputs>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '' },
  });

  const onSubmit = async (data: FormInputs) => {
    if (!user) return;
    try {
      setApiError(null);
      await usersApi.resetPassword(user.id, data.newPassword);
      reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      setApiError(error.response?.data?.message || 'Не вдалося скинути пароль');
    }
  };

  const handleClose = () => {
    reset();
    setApiError(null);
    onClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Скидання пароля для {user?.email}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers>
          {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}
          <Controller
            name="newPassword"
            control={control}
            render={({ field }) => (
              <TextField {...field} type="password" label="Новий пароль" error={!!errors.newPassword} helperText={errors.newPassword?.message} fullWidth />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isSubmitting}>Скасувати</Button>
          <Button type="submit" variant="contained" color="warning" disabled={isSubmitting}>
            {isSubmitting ? 'Скидання...' : 'Скинути пароль'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};