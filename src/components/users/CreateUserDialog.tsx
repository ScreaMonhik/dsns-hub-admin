import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, MenuItem, Box, Alert 
} from '@mui/material';
import { useState } from 'react';
import { usersApi, type CreateUserPayload } from '../../api/usersApi';

const createUserSchema = z.object({
  email: z.string().email().endsWith('@dsns.gov.ua', 'Must be a @dsns.gov.ua domain'),
  password: z.string().min(6, 'Min 6 characters'),
  firstName: z.string().min(2, 'Required'),
  lastName: z.string().min(2, 'Required'),
  role: z.enum(['ADMIN', 'USER']),
});

type FormInputs = z.infer<typeof createUserSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateUserDialog = ({ open, onClose, onSuccess }: Props) => {
  const [apiError, setApiError] = useState<string | null>(null);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormInputs>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { email: '', password: '', firstName: '', lastName: '', role: 'USER' },
  });

  const onSubmit = async (data: FormInputs) => {
    try {
      setApiError(null);
      await usersApi.createUser(data);
      reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      setApiError(error.response?.data?.message || 'Failed to create user');
    }
  };

  const handleClose = () => {
    reset();
    setApiError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Employee</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers>
          {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Email Address" error={!!errors.email} helperText={errors.email?.message} fullWidth />
              )}
            />
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField {...field} type="password" label="Password" error={!!errors.password} helperText={errors.password?.message} fullWidth />
              )}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Controller
                name="firstName"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="First Name" error={!!errors.firstName} helperText={errors.firstName?.message} fullWidth />
                )}
              />
              <Controller
                name="lastName"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Last Name" error={!!errors.lastName} helperText={errors.lastName?.message} fullWidth />
                )}
              />
            </Box>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <TextField {...field} select label="Role" error={!!errors.role} helperText={errors.role?.message} fullWidth>
                  <MenuItem value="USER">USER</MenuItem>
                  <MenuItem value="ADMIN">ADMIN</MenuItem>
                </TextField>
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};