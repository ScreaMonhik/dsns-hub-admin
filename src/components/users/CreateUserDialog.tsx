import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, MenuItem, Box, Alert, IconButton, InputAdornment
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useState } from 'react';
import { usersApi, type CreateUserPayload } from '../../api/usersApi';
import { useCan } from '../../hooks/useCan';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const createUserSchema = z.object({
  email: z.string().email('Некоректна адреса').endsWith('@dsns.gov.ua', 'Дозволено тільки домен @dsns.gov.ua'),
  password: z.string().regex(passwordRegex, 'Мінімум 8 символів. Обов\'язково: велика і мала літери, цифра, спецсимвол.'),
  firstName: z.string().min(2, "Обов'язкове поле"),
  lastName: z.string().min(2, "Обов'язкове поле"),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'USER']),
  isActive: z.boolean(),
});

type FormInputs = z.infer<typeof createUserSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateUserDialog = ({ open, onClose, onSuccess }: Props) => {
  const { isSuperAdmin } = useCan();
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormInputs>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { email: '', password: '', firstName: '', lastName: '', role: 'USER', isActive: true },
  });

  const onSubmit = async (data: FormInputs) => {
    try {
      setApiError(null);
      await usersApi.createUser(data);
      reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      setApiError(error.response?.data?.message || 'Не вдалося створити користувача');
    }
  };

  const handleClose = () => {
    reset();
    setApiError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Додати нового співробітника</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers>
          {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Електронна пошта" error={!!errors.email} helperText={errors.email?.message} fullWidth />
              )}
            />
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField 
                  {...field} 
                  type={showPassword ? 'text' : 'password'} 
                  label="Пароль" 
                  error={!!errors.password} 
                  helperText={errors.password?.message} 
                  fullWidth 
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }
                  }}
                />
              )}
            />
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
                  {isSuperAdmin && (
                    <MenuItem value="SUPER_ADMIN">Супер-адміністратор</MenuItem>
                  )}
                </TextField>
              )}
            />
          </Box>
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