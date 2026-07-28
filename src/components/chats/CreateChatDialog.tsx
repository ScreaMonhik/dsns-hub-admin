import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Box, Alert, Typography, Autocomplete, CircularProgress
} from '@mui/material';
import { chatsApi } from '../../api/chatsApi';
import { usersApi } from '../../api/usersApi';
import { DepartmentAutocomplete } from '../common/DepartmentAutocomplete';
import type { Department } from '../../api/departmentsApi';
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
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  const [options, setOptions] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [selectedAdmins, setSelectedAdmins] = useState<User[]>([]);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormInputs>({
    resolver: zodResolver(createChatSchema),
    defaultValues: { name: '', departmentId: null, adminIds: [] },
  });

  useEffect(() => {
    if (open) {
      reset({ name: '', departmentId: null, adminIds: [] });
      setSelectedAdmins([]);
      setSelectedDepartment(null);
      setSearchQuery('');
      setApiError(null);
    } else {
      setOptions([]);
    }
  }, [open, reset]);

  // Пошук адміністраторів (виконується тільки при наявності тексту)
  useEffect(() => {
    if (!open) return;
    const handler = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setOptions([]);
        return;
      }
      setLoadingOptions(true);
      try {
        const response = await usersApi.getUsers(1, 20, searchQuery);
        setOptions(response.data);
      } catch (error) {
        console.error('Помилка пошуку користувачів', error);
      } finally {
        setLoadingOptions(false);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery, open]);

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
              <DepartmentAutocomplete
                value={selectedDepartment}
                onChange={(_, newValue) => {
                  const val = newValue as Department | null;
                  setSelectedDepartment(val);
                  field.onChange(val ? val.id : null);
                }}
                placeholder={!selectedDepartment ? "Загальнонаціональний (всі підрозділи)" : ""}
              />
            )}/>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Призначити адміністраторів (обов'язково)</Typography>
            <Controller name="adminIds" control={control} render={({ field }) => (
              <Autocomplete
                multiple
                options={options}
                loading={loadingOptions}
                getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.email})`}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={selectedAdmins}
                onChange={(_, newValue) => {
                  setSelectedAdmins(newValue);
                  field.onChange(newValue.map(u => u.id));
                }}
                inputValue={searchQuery}
                onInputChange={(_, newInputValue) => setSearchQuery(newInputValue)}
                noOptionsText={searchQuery.trim() ? "Не знайдено" : "Почніть вводити пошту або ім'я..."}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={selectedAdmins.length === 0 ? "Пошук співробітників..." : ""}
                    error={!!errors.adminIds}
                    helperText={errors.adminIds?.message}
                    slotProps={{
                      ...params.slotProps,
                      input: {
                        ...((params as any).InputProps || params.slotProps?.input),
                        endAdornment: (
                          <>
                            {loadingOptions ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.slotProps?.input?.endAdornment || (params as any).InputProps?.endAdornment}
                          </>
                        ),
                      },
                    }}
                  />
                )}
              />
            )}/>
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