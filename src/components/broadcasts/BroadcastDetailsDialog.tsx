import { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Typography, Box, Chip, Divider, Avatar, CircularProgress, Alert
} from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import DevicesIcon from '@mui/icons-material/Devices';
import { format } from 'date-fns';
import { broadcastsApi, type EmergencyBroadcast, type BroadcastSeverity } from '../../api/broadcastsApi';
import { SecureImage } from '../common/SecureImage';

interface Props {
  open: boolean;
  broadcastId: string | null;
  onClose: () => void;
}

export const BroadcastDetailsDialog = ({ open, broadcastId, onClose }: Props) => {
  const [broadcast, setBroadcast] = useState<EmergencyBroadcast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && broadcastId) {
      const fetchDetails = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await broadcastsApi.getBroadcastById(broadcastId);
          setBroadcast(data);
        } catch (err: any) {
          setError(err.response?.data?.message || 'Не вдалося завантажити деталі розсилки');
        } finally {
          setLoading(false);
        }
      };
      fetchDetails();
    } else {
      setBroadcast(null);
    }
  }, [open, broadcastId]);

  if (!open) return null;

  const getSeverityChip = (severity: BroadcastSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return <Chip label="КРИТИЧНА ТРИВОГА" color="error" sx={{ fontWeight: 'bold' }} size="small" />;
      case 'WARNING':
        return <Chip label="УВАГА" color="warning" sx={{ fontWeight: 'bold' }} size="small" />;
      case 'INFO':
        return <Chip label="ІНФО" color="info" size="small" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'SENT': return 'Відправлено';
      case 'FAILED': return 'Помилка';
      case 'PENDING': return 'В обробці';
      default: return status;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CampaignIcon color="primary" /> Деталі розсилки та звіт про доставку
      </DialogTitle>
      
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, minHeight: 200 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', py: 5 }}>
            <CircularProgress />
          </Box>
        )}
        
        {error && <Alert severity="error">{error}</Alert>}

        {!loading && broadcast && (
          <>
        <Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1, flexWrap: 'wrap' }}>
            {getSeverityChip(broadcast.severity)}
            <Chip 
              label={`Статус: ${getStatusLabel(broadcast.status)}`} 
              color={broadcast.status === 'SENT' ? 'success' : 'default'} 
              size="small" 
              variant="outlined" 
            />
            <Chip 
              icon={<VolumeUpIcon />} 
              label={`Звук: ${broadcast.soundPreset}`} 
              size="small" 
              variant="outlined" 
            />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {broadcast.title}
          </Typography>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Текст повідомлення (Зміст Push)
          </Typography>
          <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body1">{broadcast.body}</Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1, minWidth: 200, p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', mb: 0.5 }}>
              <DevicesIcon />
              <Typography variant="subtitle2">Охоплення отримувачів</Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {broadcast.recipientCount} <Typography component="span" variant="body2" color="text.secondary">пристроїв</Typography>
            </Typography>
          </Box>

          <Box sx={{ flex: 1, minWidth: 200, p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Дата та час відправки
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {format(new Date(broadcast.createdAt), 'dd.MM.yyyy HH:mm:ss')}
            </Typography>
          </Box>
        </Box>

        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Цільові підрозділи
          </Typography>
          <Typography variant="body2">
            {broadcast.departments?.length 
              ? broadcast.departments.map(d => d.name).join(', ') 
              : 'Загальнонаціональне охоплення (Усі підрозділи)'}
          </Typography>
        </Box>

        {broadcast.author && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Відправлено черговим
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ width: 32, height: 32 }}>
                {broadcast.author.avatarUrl 
                  ? <SecureImage src={broadcast.author.avatarUrl} alt="A" /> 
                  : broadcast.author.firstName.charAt(0)}
              </Avatar>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {broadcast.author.firstName} {broadcast.author.lastName}
              </Typography>
            </Box>
          </Box>
        )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Закрити звіт
        </Button>
      </DialogActions>
    </Dialog>
  );
};