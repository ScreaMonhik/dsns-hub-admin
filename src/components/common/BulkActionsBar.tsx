import { Box, Paper, Typography, Button, Slide, CircularProgress, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PublicIcon from '@mui/icons-material/Public';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import CloseIcon from '@mui/icons-material/Close';

export interface BulkActionsBarProps {
  selectedCount: number;
  onClear: () => void;
  onPublish?: () => void;
  onArchive?: () => void;
  onUnarchive?: () => void;
  onDelete?: () => void;
  isProcessing?: boolean;
}

export const BulkActionsBar = ({ selectedCount, onClear, onPublish, onArchive, onUnarchive, onDelete, isProcessing }: BulkActionsBarProps) => {
  return (
    <Slide direction="up" in={selectedCount > 0} mountOnEnter unmountOnExit>
      <Paper 
        elevation={6}
        sx={{
          position: 'fixed',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1300,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          px: 3,
          py: 1.5,
          borderRadius: 3,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
          <IconButton size="small" onClick={onClear} disabled={isProcessing}>
            <CloseIcon fontSize="small" />
          </IconButton>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            Вибрано: {selectedCount}
          </Typography>
        </Box>

        {onPublish && (
          <Button size="small" color="success" variant="outlined" startIcon={<PublicIcon />} onClick={onPublish} disabled={isProcessing}>
            Опублікувати
          </Button>
        )}
        
        {onArchive && (
          <Button size="small" color="warning" variant="outlined" startIcon={<ArchiveIcon />} onClick={onArchive} disabled={isProcessing}>
            В архів
          </Button>
        )}

        {onUnarchive && (
          <Button size="small" color="primary" variant="outlined" startIcon={<UnarchiveIcon />} onClick={onUnarchive} disabled={isProcessing}>
            Відновити
          </Button>
        )}

        {onDelete && (
          <Button size="small" color="error" variant="outlined" startIcon={<DeleteIcon />} onClick={onDelete} disabled={isProcessing}>
            Видалити
          </Button>
        )}

        {isProcessing && <CircularProgress size={24} sx={{ ml: 1 }} />}
      </Paper>
    </Slide>
  );
};