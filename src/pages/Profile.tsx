import { useState, useRef, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Box, Typography, Paper, Tabs, Tab, Button, TextField, 
  Avatar, CircularProgress, Grid, Divider, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Pagination, Chip, IconButton
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import PersonIcon from '@mui/icons-material/Person';
import SecurityIcon from '@mui/icons-material/Security';
import HistoryIcon from '@mui/icons-material/History';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuthStore } from '../store/authStore';
import { usersApi } from '../api/usersApi';
import { auditApi, type PaginatedAuditLogsResponse } from '../api/auditApi';
import { SecureImage } from '../components/common/SecureImage';

const passwordSchema = z.object({
  oldPassword: z.string().min(1, 'Введіть поточний пароль'),
  newPassword: z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, 'Мінімум 8 символів. Обов\'язково: велика і мала літери, цифра, спецсимвол.'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Паролі не співпадають",
  path: ["confirmPassword"],
});

type PasswordFormInputs = z.infer<typeof passwordSchema>;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other} style={{ flexGrow: 1 }}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const Profile = () => {
  const { user, updateCurrentUser } = useAuthStore();
  const [tabValue, setTabValue] = useState(0);

  // Avatar Upload State
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Activity Log State
  const [logsData, setLogsData] = useState<PaginatedAuditLogsResponse | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(1);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PasswordFormInputs>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
  });

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploadingAvatar(true);
      const res = await usersApi.uploadMyAvatar(file);
      updateCurrentUser({ avatarUrl: res.avatarUrl });
      toast.success('Аватар успішно оновлено');
    } catch (error) {
      console.error('Avatar upload failed', error);
      toast.error('Не вдалося оновити аватар');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onSubmitPassword = async (data: PasswordFormInputs) => {
    if (!user) return;
    try {
      await usersApi.changeMyPassword({ 
        oldPassword: data.oldPassword, 
        newPassword: data.newPassword 
      });
      toast.success('Пароль успішно змінено');
      reset();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Не вдалося змінити пароль');
    }
  };

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    try {
      setLogsLoading(true);
      const result = await auditApi.getLogs(logsPage, 10, undefined, undefined, undefined, undefined, user.id);
      setLogsData(result);
    } catch (error) {
      console.error('Failed to fetch personal audit logs', error);
      toast.error('Не вдалося завантажити історію активності');
    } finally {
      setLogsLoading(false);
    }
  }, [logsPage, user]);

  useEffect(() => {
    if (tabValue === 2) {
      fetchLogs();
    }
  }, [tabValue, fetchLogs]);

  if (!user) return null;

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Особистий кабінет</Typography>
      
      <Paper sx={{ width: '100%', display: 'flex', flexDirection: 'column', minHeight: 500 }}>
        <Tabs 
          value={tabValue} 
          onChange={(_, newValue) => setTabValue(newValue)} 
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 2 }}
        >
          <Tab icon={<PersonIcon />} iconPosition="start" label="Профіль" />
          <Tab icon={<SecurityIcon />} iconPosition="start" label="Безпека" />
          <Tab icon={<HistoryIcon />} iconPosition="start" label="Моя активність" />
        </Tabs>

        {/* 1. Вкладка "Профіль" */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box sx={{ position: 'relative', mb: 2 }}>
                <Avatar sx={{ width: 140, height: 140, bgcolor: 'primary.main', fontSize: '3rem' }}>
                  {user.avatarUrl ? (
                    <SecureImage src={user.avatarUrl} alt="Аватар" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    user.firstName.charAt(0).toUpperCase()
                  )}
                </Avatar>
                <IconButton 
                  color="primary" 
                  sx={{ position: 'absolute', bottom: 0, right: 0, bgcolor: 'background.paper', boxShadow: 2, '&:hover': { bgcolor: 'background.default' } }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? <CircularProgress size={24} /> : <PhotoCameraIcon />}
                </IconButton>
                <input type="file" hidden ref={fileInputRef} accept="image/jpeg, image/png, image/webp" onChange={handleAvatarUpload} />
              </Box>
              <Typography variant="h6">{user.firstName} {user.lastName}</Typography>
              <Chip 
                label={user.role === 'SUPER_ADMIN' ? 'Супер-адміністратор' : user.role === 'ADMIN' ? 'Адміністратор' : 'Користувач'} 
                color="primary" 
                size="small" 
                sx={{ mt: 1 }} 
              />
            </Grid>
            
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Персональні дані</Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField label="Ім'я" value={user.firstName} fullWidth disabled />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField label="Прізвище" value={user.lastName} fullWidth disabled />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField label="Електронна пошта" value={user.email} fullWidth disabled />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField 
                    label="Дата реєстрації" 
                    value={user.createdAt && !isNaN(Date.parse(user.createdAt)) 
                      ? format(new Date(user.createdAt), 'dd.MM.yyyy HH:mm') 
                      : '—'} 
                    fullWidth 
                    disabled 
                  />
                </Grid>
              </Grid>
              {user.role !== 'SUPER_ADMIN' && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                  * Для зміни базових даних зверніться до керівництва (Супер-адміністратора)
                </Typography>
              )}
            </Grid>
          </Grid>
        </TabPanel>

        {/* 2. Вкладка "Безпека" (Зміна пароля) */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Зміна пароля</Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Box component="form" onSubmit={handleSubmit(onSubmitPassword)} sx={{ maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Controller
              name="oldPassword"
              control={control}
              render={({ field }) => (
                <TextField {...field} type="password" label="Поточний пароль" error={!!errors.oldPassword} helperText={errors.oldPassword?.message} fullWidth />
              )}
            />
            <Controller
              name="newPassword"
              control={control}
              render={({ field }) => (
                <TextField {...field} type="password" label="Новий пароль" error={!!errors.newPassword} helperText={errors.newPassword?.message} fullWidth />
              )}
            />
            <Controller
              name="confirmPassword"
              control={control}
              render={({ field }) => (
                <TextField {...field} type="password" label="Підтвердження нового пароля" error={!!errors.confirmPassword} helperText={errors.confirmPassword?.message} fullWidth />
              )}
            />
            <Button type="submit" variant="contained" disabled={isSubmitting} size="large">
              {isSubmitting ? 'Збереження...' : 'Змінити пароль'}
            </Button>
          </Box>
        </TabPanel>

        {/* 3. Вкладка "Моя активність" */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Історія моїх дій у системі</Typography>
          
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Час події</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Дія</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Ресурс</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Деталі / IP</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logsLoading ? (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3 }}><CircularProgress size={24} /></TableCell></TableRow>
                ) : logsData?.data.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>{format(new Date(log.createdAt), 'dd.MM.yyyy HH:mm:ss')}</TableCell>
                    <TableCell>
                      <Chip label={log.action} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{log.resource}</TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ display: 'block', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                        {log.details ? (typeof log.details === 'object' ? JSON.stringify(log.details, null, 2) : log.details) : '—'}
                      </Typography>
                      {log.ipAddress && <Typography variant="caption" color="text.secondary">IP: {log.ipAddress}</Typography>}
                    </TableCell>
                  </TableRow>
                ))}
                {!logsLoading && (logsData?.data.length === 0 || !logsData) && (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3 }}>Історія активності порожня</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {logsData && logsData.meta.lastPage > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination count={logsData.meta.lastPage} page={logsPage} onChange={(_, value) => setLogsPage(value)} color="primary" />
            </Box>
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
};