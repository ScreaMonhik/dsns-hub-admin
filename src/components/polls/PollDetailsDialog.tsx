import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Chip, Divider } from '@mui/material';
import { format } from 'date-fns';
import { PollStatus, type Poll } from '../../api/pollsApi';

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
              <Chip label={`Автор: ${poll.author.firstName} ${poll.author.lastName}`} size="small" variant="outlined" />
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
                <Box key={opt.id} sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{opt.text}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {opt._count?.votes || 0} ({percentage}%)
                    </Typography>
                  </Box>
                  <Box sx={{ width: '100%', height: 6, bgcolor: 'action.hover', borderRadius: 3, overflow: 'hidden' }}>
                    <Box sx={{ width: `${percentage}%`, height: '100%', bgcolor: 'primary.main', transition: 'width 0.5s ease' }} />
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