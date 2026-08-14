import { useEffect, useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, 
  List, ListItem, ListItemText, ListItemAvatar, Avatar, IconButton, 
  Typography, CircularProgress, Box, Alert, Tooltip, Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';
import { newsApi, type News, type NewsComment } from '../../api/newsApi';

interface NewsCommentsDialogProps {
  open: boolean;
  news: News | null;
  onClose: () => void;
  onRefreshNews: () => void;
}

export const NewsCommentsDialog = ({ open, news, onClose, onRefreshNews }: NewsCommentsDialogProps) => {
  const [comments, setComments] = useState<NewsComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (open && news) {
      fetchComments();
    } else {
      setComments([]);
      setApiError(null);
    }
  }, [open, news]);

  const fetchComments = async () => {
    if (!news) return;
    try {
      setLoading(true);
      setApiError(null);
      const data = await newsApi.getNewsComments(news.id);
      setComments(data);
    } catch (error: any) {
      setApiError(error.response?.data?.message || 'Не вдалося завантажити коментарі');
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteComment = async () => {
    if (!news || !commentToDelete) return;
    
    try {
      setApiError(null);
      await newsApi.deleteNewsComment(news.id, commentToDelete);
      setComments(prev => prev.filter(c => c.id !== commentToDelete));
      onRefreshNews();
    } catch (error: any) {
      setApiError(error.response?.data?.message || 'Не вдалося видалити коментар');
    } finally {
      setCommentToDelete(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
      <DialogTitle>Коментарі до новини</DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        {apiError && <Alert severity="error" sx={{ m: 2 }}>{apiError}</Alert>}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : comments.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
            Коментарів ще немає
          </Box>
        ) : (
          <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {comments.map((comment, index) => (
              <Box key={comment.id}>
                <ListItem
                  alignItems="flex-start"
                  secondaryAction={
                    <Tooltip title="Видалити коментар">
                      <IconButton edge="end" size="small" color="error" onClick={() => setCommentToDelete(comment.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  }
                >
                  <ListItemAvatar>
                    <Avatar src={comment.author.avatarUrl || undefined} alt={comment.author.firstName}>
                      {comment.author.firstName.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 4 }}>
                        <Typography variant="subtitle2" component="span">
                          {comment.author.firstName} {comment.author.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" component="span">
                          {format(new Date(comment.createdAt), 'dd.MM.yyyy HH:mm')}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="text.primary" sx={{ mt: 0.5, wordBreak: 'break-word', pr: 4 }}>
                        {comment.content}
                      </Typography>
                    }
                  />
                </ListItem>
                {index < comments.length - 1 && <Divider variant="inset" component="li" />}
              </Box>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">Закрити</Button>
      </DialogActions>

      <Dialog open={!!commentToDelete} onClose={() => setCommentToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Підтвердження видалення</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Ви впевнені, що хочете видалити цей коментар? Цю дію не можна скасувати.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentToDelete(null)}>Скасувати</Button>
          <Button onClick={confirmDeleteComment} variant="contained" color="error">
            Видалити
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};