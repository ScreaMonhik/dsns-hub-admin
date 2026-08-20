import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Alert, Typography, Chip, Stack
} from '@mui/material';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { format } from 'date-fns';
import { pollsApi, type Poll } from '../../api/pollsApi';

const visibilitySchema = z.object({
  extendDays: z.union([z.string(), z.number()]).refine(
    (val) => val !== '' && !isNaN(Number(val)) && Number(val) >= 0,
    { message: 'Вкажіть число від 0' }
  ),
});

type FormInputs = z.infer<typeof visibilitySchema>;

interface Props {
  open: boolean;
  poll: Poll | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const PollVisibilityDialog = ({ open, poll, onClose, onSuccess }: Props) => {
  const [apiError, setApiError] = useState<string | null>(null);

  const { control, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormInputs>({
    resolver: zodResolver(visibilitySchema),
    defaultValues: { extendDays: 14 },
  });

  useEffect(() => {
    if (open) {
      setApiError(null);
      reset({ extendDays: 14 });
    }
  }, [open, reset]);

  const handleApplyPreset = (days: number) => {
    setValue('extendDays', days, { shouldValidate: true });
  };

  const onSubmit = async (data: FormInputs) => {
    if (!poll) return;
    try {
      setApiError(null);
      await pollsApi.updateVisibility(poll.id, Number(data.extendDays));
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setApiError(err.response?.data?.message || 'Не вдалося оновити видимість опитування');
    }
  };

  const isCurrentlyVisible = poll?.archivedVisibleUntil
    ? new Date(poll.archivedVisibleUntil) > new Date()
    : false;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Видимість в архіві</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {apiError && <Alert severity="error">{apiError}</Alert>}

          {poll && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Опитування:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {poll.title}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Chip
                  label={
                    isCurrentlyVisible && poll.archivedVisibleUntil
                      ? `Видиме для користувачів до ${format(new Date(poll.archivedVisibleUntil), 'dd.MM.yyyy')}`
                      : 'Приховано в архіві'
                  }
                  color={isCurrentlyVisible ? 'info' : 'default'}
                  size="small"
                />
              </Box>
            </Box>
          )}

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Швидкий вибір (пресети):
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              <Chip
                label="+7 днів"
                onClick={() => handleApplyPreset(7)}
                clickable
                color="primary"
                variant="outlined"
              />
              <Chip
                label="+14 днів"
                onClick={() => handleApplyPreset(14)}
                clickable
                color="primary"
                variant="outlined"
              />
              <Chip
                label="+30 днів"
                onClick={() => handleApplyPreset(30)}
                clickable
                color="primary"
                variant="outlined"
              />
              <Chip
                icon={<VisibilityOffIcon fontSize="small" />}
                label="Сховати зараз"
                onClick={() => handleApplyPreset(0)}
                clickable
                color="error"
                variant="outlined"
              />
            </Stack>
          </Box>

          <Controller
            name="extendDays"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                type="number"
                label="Кількість днів показу від поточного моменту"
                error={!!errors.extendDays}
                helperText={errors.extendDays?.message || 'Вкажіть 0, щоб негайно приховати опитування.'}
                fullWidth
                slotProps={{ htmlInput: { min: 0 } }}
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            Скасувати
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Збереження...' : 'Зберегти'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};