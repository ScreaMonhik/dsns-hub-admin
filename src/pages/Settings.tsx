import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Box, Typography, Paper, Grid, TextField, Switch, FormControlLabel, 
  Button, MenuItem, CircularProgress, Alert, Divider, InputAdornment 
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import BuildIcon from '@mui/icons-material/Build';
import CampaignIcon from '@mui/icons-material/Campaign';
import StorageIcon from '@mui/icons-material/Storage';
import toast from 'react-hot-toast';
import { settingsApi, type SystemSettings } from '../api/settingsApi';
import { PermissionGuard } from '../components/common/PermissionGuard';

const settingsSchema = z.object({
  maintenanceMode: z.boolean(),
  maintenanceMessage: z.string().nullable().optional(),
  globalBannerEnabled: z.boolean(),
  globalBannerText: z.string().nullable().optional(),
  globalBannerSeverity: z.enum(['INFO', 'WARNING', 'CRITICAL']),
  maxPdfSizeMB: z.number().min(1).max(100),
  maxMediaSizeMB: z.number().min(1).max(100),
});

type SettingsFormInputs = z.infer<typeof settingsSchema>;

export const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const { control, handleSubmit, reset, watch, formState: { isSubmitting, isDirty } } = useForm<SettingsFormInputs>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      maintenanceMode: false,
      maintenanceMessage: '',
      globalBannerEnabled: false,
      globalBannerText: '',
      globalBannerSeverity: 'INFO',
      maxPdfSizeMB: 10,
      maxMediaSizeMB: 10,
    },
  });

  const maintenanceMode = watch('maintenanceMode');
  const globalBannerEnabled = watch('globalBannerEnabled');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await settingsApi.getSettings();
        reset(data);
      } catch (error) {
        console.error('Failed to load settings', error);
        setApiError('Не вдалося завантажити налаштування системи.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [reset]);

  const onSubmit = async (data: SettingsFormInputs) => {
    try {
      setApiError(null);
      const updatedData = await settingsApi.updateSettings(data);
      reset(updatedData);
      toast.success('Налаштування успішно збережено');
    } catch (error: any) {
      setApiError(error.response?.data?.message || 'Не вдалося зберегти налаштування.');
      toast.error('Помилка збереження');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <PermissionGuard require="SUPER_ADMIN" redirectTo="/">
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Системні налаштування</Typography>
        </Box>

        {apiError && <Alert severity="error" sx={{ mb: 3 }}>{apiError}</Alert>}

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          {/* Режим технічних робіт */}
          <Paper sx={{ mb: 4, overflow: 'hidden' }}>
            <Box sx={{ bgcolor: 'warning.light', color: 'warning.contrastText', p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <BuildIcon />
              <Typography variant="h6">Режим обслуговування (Maintenance Mode)</Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              <Controller
                name="maintenanceMode"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} color="warning" />}
                    label="Увімкнути режим технічних робіт (Блокує доступ користувачам додатку)"
                    sx={{ mb: 2 }}
                  />
                )}
              />
              {maintenanceMode && (
                <Controller
                  name="maintenanceMessage"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value || ''}
                      label="Повідомлення для користувачів"
                      fullWidth
                      multiline
                      rows={2}
                      helperText="Цей текст побачать користувачі під час спроби входу в додаток."
                    />
                  )}
                />
              )}
            </Box>
          </Paper>

          {/* Системне сповіщення (Банер) */}
          <Paper sx={{ mb: 4, overflow: 'hidden' }}>
            <Box sx={{ bgcolor: 'info.main', color: 'info.contrastText', p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CampaignIcon />
              <Typography variant="h6">Глобальний банер адмін-панелі</Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              <Controller
                name="globalBannerEnabled"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} color="info" />}
                    label="Відображати глобальне сповіщення в адмін-панелі"
                    sx={{ mb: 2 }}
                  />
                )}
              />
              {globalBannerEnabled && (
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <Controller
                      name="globalBannerText"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          value={field.value || ''}
                          label="Текст сповіщення"
                          fullWidth
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Controller
                      name="globalBannerSeverity"
                      control={control}
                      render={({ field }) => (
                        <TextField {...field} select label="Рівень важливості" fullWidth>
                          <MenuItem value="INFO">Інфо (Синій)</MenuItem>
                          <MenuItem value="WARNING">Увага (Жовтий)</MenuItem>
                          <MenuItem value="CRITICAL">Критично (Червоний)</MenuItem>
                        </TextField>
                      )}
                    />
                  </Grid>
                </Grid>
              )}
            </Box>
          </Paper>

          {/* Ліміти розміру файлів */}
          <Paper sx={{ mb: 4, overflow: 'hidden' }}>
            <Box sx={{ bgcolor: 'success.main', color: 'success.contrastText', p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <StorageIcon />
              <Typography variant="h6">Обмеження медіа та документів</Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="maxPdfSizeMB"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        type="number"
                        label="Макс. розмір PDF"
                        fullWidth
                        slotProps={{ input: { endAdornment: <InputAdornment position="end">МБ</InputAdornment> } }}
                      />
                    )}
                  />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Controller
                      name="maxMediaSizeMB"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        type="number"
                        label="Макс. розмір зображень/відео"
                        fullWidth
                        slotProps={{ input: { endAdornment: <InputAdornment position="end">МБ</InputAdornment> } }}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Box>
          </Paper>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', position: 'sticky', bottom: 20, zIndex: 10 }}>
            <Button 
              type="submit" 
              variant="contained" 
              size="large" 
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              disabled={isSubmitting || !isDirty}
              sx={{ boxShadow: 4, borderRadius: 2 }}
            >
              {isSubmitting ? 'Збереження...' : 'Зберегти всі налаштування'}
            </Button>
          </Box>
        </Box>
      </Box>
    </PermissionGuard>
  );
};