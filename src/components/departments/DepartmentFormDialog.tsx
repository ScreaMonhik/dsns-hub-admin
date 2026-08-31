import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Box, Alert 
} from '@mui/material';
import { departmentsApi, type Department } from '../../api/departmentsApi';
import { DepartmentAutocomplete } from '../common/DepartmentAutocomplete';

const departmentSchema = z.object({
  name: z.string().min(2, 'Мінімум 2 символи'),
  parentId: z.string().nullable().optional(),
});

type FormInputs = z.infer<typeof departmentSchema>;

interface Props {
  open: boolean;
  department: Department | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const DepartmentFormDialog = ({ open, department, onClose, onSuccess }: Props) => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedParent, setSelectedParent] = useState<Department | null>(null);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormInputs>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { name: '', parentId: null },
  });

  useEffect(() => {
    if (open) {
      setApiError(null);
      if (department) {
        reset({ name: department.name, parentId: department.parentId || null });
        // Якщо потрібно відображати назву батьківського підрозділу, тут має бути логіка його підвантаження,
        // але для простоти зараз залишаємо null, або можна передавати об'єкт parent при наявності.
        setSelectedParent(null); 
      } else {
        reset({ name: '', parentId: null });
        setSelectedParent(null);
      }
    }
  }, [open, department, reset]);

  const onSubmit = async (data: FormInputs) => {
    try {
      setApiError(null);
      if (department) {
        await departmentsApi.updateDepartment(department.id, data);
      } else {
        await departmentsApi.createDepartment({ name: data.name, parentId: data.parentId });
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      if (error.response?.status === 409) {
        setApiError('Підрозділ з такою назвою вже існує в цьому рівні.');
      } else {
        setApiError(error.response?.data?.message || 'Помилка збереження підрозділу');
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{department ? 'Редагувати підрозділ' : 'Створити підрозділ'}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {apiError && <Alert severity="error">{apiError}</Alert>}
          
          <Controller 
            name="name" 
            control={control} 
            render={({ field }) => (
              <TextField 
                {...field} 
                label="Назва підрозділу" 
                error={!!errors.name} 
                helperText={errors.name?.message} 
                fullWidth 
                autoFocus 
              />
            )}
          />

          <Controller 
            name="parentId" 
            control={control} 
            render={({ field }) => (
              <DepartmentAutocomplete
                label="Батьківський підрозділ (необов'язково)"
                value={selectedParent}
                onChange={(_, newValue) => {
                  const val = newValue as Department | null;
                  setSelectedParent(val);
                  field.onChange(val ? val.id : null);
                }}
                placeholder="Головне управління (кореневий рівень)"
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>Скасувати</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Збереження...' : 'Зберегти'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};