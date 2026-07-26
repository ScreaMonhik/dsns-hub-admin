import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Box, Alert, MenuItem, Select, Chip, Typography
} from '@mui/material';
import { chatsApi } from '../../api/chatsApi';
import { usersApi } from '../../api/usersApi';
import { pollsApi, type PollDepartment } from '../../api/pollsApi';
import type { User } from '../../store/authStore';

const createChatSchema = z.object({
  name: z.string().min(3, 'Мінімум 3 символи'),
  departmentId: z.string().nullable(),
  adminIds: z.array(z.string()).min(1, 'Оберіть хоча б одного адміністратора'),
});

type FormInputs = z.infer<typeof createChatSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateChatDialog = ({ open, onClose, onSuccess }: Props) => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<PollDepartment[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormInputs>({
    resolver: zodResolver(createChatSchema),
    defaultValues: { name: '', departmentId: null, adminIds: [] },
  });

  useEffect(() => {
    if (open) {
      pollsApi.getDepartments().then(setDepartments).catch(console.error);
      // Завантажуємо першу сторінку користувачів для вибору адмінів
      usersApi.getUsers(1, 100).then(res => setUsers(res.data)).catch(console.error);
      reset({ name: '', departmentId: null, adminIds: [] });
      setApiError(null);
    }
  }, [open, reset]);

  const onSubmit = async (data: FormInputs) => {
    try {
      setApiError(null);
      await chatsApi.createGroup({
        name: data.name,
        departmentId: data.departmentId,
        adminIds: data.adminIds,
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      setApiError(error.response?.data?.message || 'Не вдалося створити чат');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Створити новий чат</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {apiError && <Alert severity="error">{apiError}</Alert>}
          
          <Controller name="name" control={control} render={({ field }) => (
            <TextField {...field} label="Назва чату" error={!!errors.name} helperText={errors.name?.message} fullWidth autoFocus />
          )}/>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Підрозділ (опціонально)</Typography>
            <Controller name="departmentId" control={control} render={({ field }) => (
              <TextField 
                {...field} 
                select 
                fullWidth 
                value={field.value || ''}
              >
                <MenuItem value=""><em>Загальний (без підрозділу)</em></MenuItem>
                {departments.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </TextField>
            )}/>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Призначити адміністраторів (обов'язково)</Typography>
            <Controller name="adminIds" control={control} render={({ field }) => (
              <Select
                {...field}
                multiple
                fullWidth
                error={!!errors.adminIds}
                displayEmpty
                renderValue={(selected) => {
                  if (selected.length === 0) return <Typography color="text.secondary">Оберіть співробітників...</Typography>;
                  return (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((val) => {
                        const user = users.find(u => u.id === val);
                        return <Chip key={val} label={user ? `${user.firstName} ${user.lastName}` : val} size="small" />;
                      })}
                    </Box>
                  );
                }}
              >
                {users.map(u => (
                  <MenuItem key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</MenuItem>
                ))}
              </Select>
            )}/>
            {errors.adminIds && <Typography color="error" variant="caption" sx={{ mt: 0.5, display: 'block' }}>{errors.adminIds.message}</Typography>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>Скасувати</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Створення...' : 'Створити чат'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};