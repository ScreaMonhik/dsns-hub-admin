import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Chip, Divider, Avatar } from '@mui/material';
import { format } from 'date-fns';
import { PollStatus, type Poll } from '../../api/pollsApi';
import { SecureImage } from '../common/SecureImage';

interface Props {
  open: boolean;
  poll: Poll | null;
  onClose: () => void;
}

export const PollDetailsDialog = ({ open, poll, onClose }: Props) => {
  if (!poll) return null;

  const getStatusChip = (status: PollStatus) => {
    switch(status) {
      case PollStatus.PUBLISHED: return <Chip label="Опубліковано" color="success" size="small" />;
      case PollStatus.ARCHIVED: return <Chip label="В архіві" color="warning" size="small" />;
      case PollStatus.DRAFT: return <Chip label="Чернетка" color="default" size="small" />;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
      <DialogTitle>Деталі опитування</DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Box>
          <Typography variant="h6">{poll.title}</Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
            {getStatusChip(poll.status)}
            <Chip label={`Створено: ${format(new Date(poll.createdAt), 'dd.MM.yyyy HH:mm')}`} size="small" variant="outlined" />
            {poll.author && (
              <Chip 
                label={`Автор: ${poll.author.firstName} ${poll.author.lastName}`} 
                size="small" 
                variant="outlined" 
                avatar={
                  <Avatar sx={{ width: 24, height: 24 }}>
                    {poll.author.avatarUrl ? <SecureImage src={poll.author.avatarUrl} alt="A" /> : poll.author.firstName.charAt(0)}
                  </Avatar>
                }
              />
            )}
            {poll.expiresAt && (
              <Chip 
                label={`Завершується: ${format(new Date(poll.expiresAt), 'dd.MM.yyyy HH:mm')}`} 
                size="small" 
                color={new Date(poll.expiresAt) < new Date() ? 'error' : 'info'} 
                variant={new Date(poll.expiresAt) < new Date() ? 'filled' : 'outlined'} 
              />
            )}
          </Box>
        </Box>

        <Divider />

        {poll.description && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Опис</Typography>
            <Typography variant="body2">{poll.description}</Typography>
          </Box>
        )}

        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>Охоплення підрозділів</Typography>
          <Typography variant="body2">
            {poll.departments?.length ? poll.departments.map(d => d.name).join(', ') : 'Всі підрозділи (Загальнонаціональне)'}
          </Typography>
        </Box>

        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>Всього голосів: {poll.totalVotes || 0}</Typography>
          <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {poll.options?.map((opt) => {
              const percentage = poll.totalVotes > 0 ? Math.round(((opt._count?.votes || 0) / poll.totalVotes) * 100) : 0;
              return (
                <Box key={opt.id} sx={{ 
                  p: 2, 
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc', 
                  borderRadius: 2, 
                  border: '1px solid', 
                  borderColor: 'divider' 
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{opt.text}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {opt._count?.votes || 0} ({percentage}%)
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    width: '100%', 
                    height: 8, 
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)', 
                    borderRadius: 4, 
                    overflow: 'hidden' 
                  }}>
                    <Box sx={{ 
                      width: `${percentage}%`, 
                      height: '100%', 
                      bgcolor: 'primary.main', 
                      transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' 
                    }} />
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">Закрити</Button>
      </DialogActions>
    </Dialog>
  );
};