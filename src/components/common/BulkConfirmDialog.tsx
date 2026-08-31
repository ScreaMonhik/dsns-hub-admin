import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, CircularProgress } from '@mui/material';

export type BulkActionType = 'publish' | 'archive' | 'unarchive' | 'delete';

interface Props {
  open: boolean;
  action: BulkActionType | null;
  count: number;
  onClose: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
}

export const BulkConfirmDialog = ({ open, action, count, onClose, onConfirm, isProcessing }: Props) => {
  const getActionDetails = () => {
    switch (action) {
      case 'delete': return { 
        title: 'Підтвердження видалення', 
        text: `Ви впевнені, що хочете остаточно видалити вибрані записи (${count} шт.)? Цю дію не можна скасувати.`, 
        color: 'error' as const, 
        btnText: 'Видалити' 
      };
      case 'publish': return { 
        title: 'Підтвердження публікації', 
        text: `Ви впевнені, що хочете опублікувати вибрані записи (${count} шт.)?`, 
        color: 'success' as const, 
        btnText: 'Опублікувати' 
      };
      case 'archive': return { 
        title: 'Переміщення в архів', 
        text: `Ви впевнені, що хочете перемістити в архів вибрані записи (${count} шт.)?`, 
        color: 'warning' as const, 
        btnText: 'В архів' 
      };
      case 'unarchive': return { 
        title: 'Відновлення з архіву', 
        text: `Ви впевнені, що хочете відновити як чернетки вибрані записи (${count} шт.)?`, 
        color: 'primary' as const, 
        btnText: 'Відновити' 
      };
      default: return { title: '', text: '', color: 'primary' as const, btnText: 'Підтвердити' };
    }
  };

  const details = getActionDetails();

  return (
    <Dialog open={open} onClose={!isProcessing ? onClose : undefined} maxWidth="xs" fullWidth>
      <DialogTitle>{details.title}</DialogTitle>
      <DialogContent dividers>
        <DialogContentText>{details.text}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isProcessing}>Скасувати</Button>
        <Button onClick={onConfirm} variant="contained" color={details.color} disabled={isProcessing}>
          {isProcessing ? <CircularProgress size={24} color="inherit" /> : details.btnText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};