import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, MenuItem, Box, Alert, Typography, 
  FormControlLabel, Radio, RadioGroup, DialogContentText
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CampaignIcon from '@mui/icons-material/Campaign';
import { broadcastsApi, type BroadcastSeverity, type SoundPreset } from '../../api/broadcastsApi';
import { DepartmentAutocomplete } from '../common/DepartmentAutocomplete';
import type { Department } from '../../api/departmentsApi';

const broadcastSchema = z.object({
  title: z.string().min(3, 'Заголовок має містити щонайменше 3 символи').max(65, 'Максимальна довжина заголовка — 65 символів'),
  body: z.string().min(5, 'Текст повідомлення має містити щонайменше 5 символів').max(240, 'Максимальна довжина повідомлення — 240 символів'),
  severity: z.enum(['INFO', 'WARNING', 'CRITICAL']),
  soundPreset: z.enum(['DEFAULT', 'SIREN', 'ALERT']),
  departmentIds: z.array(z.string()).optional(),
});

type FormInputs = z.infer<typeof broadcastSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateBroadcastDialog = ({ open, onClose, onSuccess }: Props) => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedDepartments, setSelectedDepartments] = useState<Department[]>([]);
  const [confirmCriticalOpen, setConfirmCriticalOpen] = useState(false);
  const [pendingData, setPendingData] = useState<FormInputs | null>(null);

  const { control, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormInputs>({
    resolver: zodResolver(broadcastSchema),
    defaultValues: {
      title: '',
      body: '',
      severity: 'INFO',
      soundPreset: 'DEFAULT',
      departmentIds: [],
    },
  });

  const selectedSeverity = watch('severity');

  const getSoundPresetForSeverity = (severity: BroadcastSeverity): SoundPreset => {
    switch (severity) {
      case 'CRITICAL':
        return 'SIREN';
      case 'WARNING':
        return 'ALERT';
      case 'INFO':
      default:
        return 'DEFAULT';
    }
  };

  const executeSend = async (data: FormInputs) => {
    try {
      setApiError(null);
      const payload = {
        ...data,
        soundPreset: getSoundPresetForSeverity(data.severity),
      };
      await broadcastsApi.sendBroadcast(payload);
      handleClose();
      onSuccess();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setApiError(err.response?.data?.message || 'Не вдалося відправити розсилку');
    }
  };

  const onSubmit = (data: FormInputs) => {
    if (data.severity === 'CRITICAL') {
      setPendingData(data);
      setConfirmCriticalOpen(true);
    } else {
      executeSend(data);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedDepartments([]);
    setApiError(null);
    setPendingData(null);
    setConfirmCriticalOpen(false);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CampaignIcon color="error" />
          Створити екстрену розсилку
        </DialogTitle>

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {apiError && <Alert severity="error">{apiError}</Alert>}

            <Controller
              name="severity"
              control={control}
              render={({ field }) => (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Рівень загрози
                  </Typography>
                  <RadioGroup {...field} row>
                    <FormControlLabel 
                      value="INFO" 
                      control={<Radio color="info" />} 
                      label={<Typography variant="body2" color="info.main" sx={{ fontWeight: 600 }}>Інформаційний</Typography>} 
                    />
                    <FormControlLabel 
                      value="WARNING" 
                      control={<Radio color="warning" />} 
                      label={<Typography variant="body2" color="warning.main" sx={{ fontWeight: 600 }}>Увага (Попередження)</Typography>} 
                    />
                    <FormControlLabel 
                      value="CRITICAL" 
                      control={<Radio color="error" />} 
                      label={<Typography variant="body2" color="error.main" sx={{ fontWeight: 700 }}>Критичний (Червона тривога)</Typography>} 
                    />
                  </RadioGroup>
                </Box>
              )}
            />

            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Заголовок сповіщення"
                  error={!!errors.title}
                  helperText={errors.title?.message || 'Відображається в заголовку Push-сповіщення'}
                  fullWidth
                  autoFocus
                />
              )}
            />

            <Controller
              name="body"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Текст Push-сповіщення"
                  multiline
                  rows={3}
                  error={!!errors.body}
                  helperText={errors.body?.message || 'Основний текст тривоги, що надходить на пристрої'}
                  fullWidth
                />
              )}
            />

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Цільові підрозділи (Опціонально)
              </Typography>
              <Controller
                name="departmentIds"
                control={control}
                render={({ field }) => (
                  <DepartmentAutocomplete
                    multiple
                    value={selectedDepartments}
                    onChange={(_, newValue) => {
                      const values = newValue as Department[];
                      setSelectedDepartments(values);
                      field.onChange(values.map(d => d.id));
                    }}
                    placeholder={selectedDepartments.length === 0 ? "Загальнонаціональна розсилка (Усі підрозділи)" : ""}
                  />
                )}
              />
            </Box>

            {selectedSeverity === 'CRITICAL' && (
              <Alert severity="error" icon={<WarningAmberIcon />}>
                Критичний рівень вмикає гучний сигнал тривоги на пристроях користувачів.
              </Alert>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleClose} disabled={isSubmitting}>
              Скасувати
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color={selectedSeverity === 'CRITICAL' ? 'error' : selectedSeverity === 'WARNING' ? 'warning' : 'primary'}
              startIcon={<CampaignIcon />}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Відправка...' : 'Надіслати Push зараз'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={confirmCriticalOpen} onClose={() => setConfirmCriticalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberIcon /> Підтвердження критичної розсилки
        </DialogTitle>
        <DialogContent dividers>
          <DialogContentText>
            Ви збираєтеся відправити <strong>КРИТИЧНУ ЕКСТРЕНУ РОЗСИЛКУ</strong>. Ця дія негайно надішле високопріоритетні Push-сповіщення на пристрої особового складу.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmCriticalOpen(false)} disabled={isSubmitting}>
            Скасувати
          </Button>
          <Button 
            onClick={() => pendingData && executeSend(pendingData)} 
            variant="contained" 
            color="error" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Відправка...' : 'ПІДТВЕРДИТИ РОЗСИЛКУ'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};