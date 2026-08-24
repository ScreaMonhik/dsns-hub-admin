import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Box, Button, TextField, Typography, Container, Alert, CircularProgress } from '@mui/material';
import { useAuthStore, type User } from '../store/authStore';
import { apiClient } from '../api/apiClient';

const loginSchema = z.object({
  email: z.string().email('Некоректна електронна пошта').endsWith('@dsns.gov.ua', 'Дозволено тільки домен @dsns.gov.ua'),
  password: z.string().min(6, 'Пароль має містити щонайменше 6 символів'),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export const Login = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormInputs) => {
    try {
      setErrorMsg(null);
      const response = await apiClient.post<LoginResponse>('/auth/login', data);
      
      const { accessToken, refreshToken, user } = response.data;
      
      if (user.role !== 'ADMIN') {
        setErrorMsg('Доступ заборонено. Потрібні права адміністратора.');
        return;
      }

      setAuth(user, accessToken, refreshToken);
      navigate('/', { replace: true });
    } catch (error: any) {
      if (error.response?.status === 403) {
        setErrorMsg('Ваш обліковий запис заблоковано. Зверніться до адміністратора.');
      } else {
        setErrorMsg(error.response?.data?.message || 'Помилка авторизації');
      }
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Адмін-панель DSNS Hub
        </Typography>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1 }}>
          {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}
          <TextField
            margin="normal"
            fullWidth
            id="email"
            label="Електронна пошта"
            autoComplete="email"
            autoFocus
            {...register('email')}
            error={!!errors.email}
            helperText={errors.email?.message}
          />
          <TextField
            margin="normal"
            fullWidth
            label="Пароль"
            type="password"
            id="password"
            autoComplete="current-password"
            {...register('password')}
            error={!!errors.password}
            helperText={errors.password?.message}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, height: 48 }}
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : undefined}
          >
            {isSubmitting ? 'Виконується вхід...' : 'Увійти'}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};