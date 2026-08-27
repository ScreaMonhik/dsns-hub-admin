import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, MenuItem, Box, Alert, FormControlLabel, Switch 
} from '@mui/material';
import { useState, useEffect } from 'react';
import { usersApi, type UpdateUserPayload } from '../../api/usersApi';
import { useAuthStore, type User } from '../../store/authStore';

const editUserSchema = z.object({
  firstName: z.string().min(2, "Обов'язкове поле"),
  lastName: z.string().min(2, "Обов'язкове поле"),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'USER']),
  isActive: z.boolean(),
});

type FormInputs = z.infer<typeof editUserSchema>;

interface Props {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditUserDialog = ({ open, user, onClose, onSuccess }: Props) => {
  const currentUser = useAuthStore((state) => state.user);
  const [apiError, setApiError] = useState<string | null>(null);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormInputs>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { firstName: '', lastName: '', role: 'USER', isActive: true },
  });

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: FormInputs) => {
    if (!user) return;
    try {
      setApiError(null);
      await usersApi.updateUser(user.id, data);
      onSuccess();
      onClose();
    } catch (error: any) {
      setApiError(error.response?.data?.message || 'Не вдалося оновити дані користувача');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Редагувати співробітника: {user?.email}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers>
          {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Controller
                name="firstName"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Ім'я" error={!!errors.firstName} helperText={errors.firstName?.message} fullWidth />
                )}
              />
              <Controller
                name="lastName"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Прізвище" error={!!errors.lastName} helperText={errors.lastName?.message} fullWidth />
                )}
              />
            </Box>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <TextField {...field} select label="Роль" error={!!errors.role} helperText={errors.role?.message} fullWidth>
                  <MenuItem value="USER">Користувач</MenuItem>
                  <MenuItem value="ADMIN">Адміністратор</MenuItem>
                  {currentUser?.role === 'SUPER_ADMIN' && (
                    <MenuItem value="SUPER_ADMIN">Супер-адміністратор</MenuItem>
                  )}
                </TextField>
              )}
            />
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                  label={field.value ? "Обліковий запис активний" : "Обліковий запис заблокований"}
                />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>Скасувати</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Збереження...' : 'Зберегти зміни'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};