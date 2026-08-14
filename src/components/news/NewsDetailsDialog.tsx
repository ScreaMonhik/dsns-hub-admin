import { useEffect, useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, 
  Box, Chip, Divider, CircularProgress, Alert, Avatar, TextField, IconButton
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import CommentIcon from '@mui/icons-material/Comment';
import { format } from 'date-fns';
import { newsApi, type News, type NewsComment } from '../../api/newsApi';
import { SecureImage } from '../common/SecureImage';
import { TipTapViewer } from './TipTapEditor';

interface Props {
  open: boolean;
  news: News | null;
  onClose: () => void;
  onRefreshList: () => void;
}

export const NewsDetailsDialog = ({ open, news, onClose, onRefreshList }: Props) => {
  const [comments, setComments] = useState<NewsComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  const fetchComments = async () => {
    if (!news) return;
    try {
      setLoadingComments(true);
      setApiError(null);
      const data = await newsApi.getNewsComments(news.id);
      setComments(data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setApiError(err.response?.data?.message || 'Не вдалося завантажити коментарі');
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    if (open && news) {
      fetchComments();
    } else {
      setComments([]);
      setCommentText('');
      setApiError(null);
    }
  }, [open, news]);

  const handleAddComment = async () => {
    if (!news || !commentText.trim()) return;
    try {
      setSubmittingComment(true);
      await newsApi.addNewsComment(news.id, commentText);
      setCommentText('');
      fetchComments();
      onRefreshList();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setApiError(err.response?.data?.message || 'Помилка додавання коментаря');
    } finally {
      setSubmittingComment(false);
    }
  };

  const confirmDeleteComment = async () => {
    if (!news || !commentToDelete) return;
    try {
      await newsApi.deleteNewsComment(news.id, commentToDelete);
      fetchComments();
      onRefreshList();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setApiError(err.response?.data?.message || 'Помилка видалення коментаря');
    } finally {
      setCommentToDelete(null);
    }
  };

  if (!open || !news) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth scroll="paper">
      <DialogTitle>Деталі новини</DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 0 }}>
        {apiError && <Alert severity="error" sx={{ m: 2 }}>{apiError}</Alert>}
        
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
          {/* ЛІВА ЧАСТИНА: Контент новини */}
          <Box sx={{ width: { xs: '100%', md: '65%' }, p: 3, borderRight: { md: 1 }, borderColor: 'divider', overflowY: 'auto', maxHeight: '75vh' }}>
            {news.imageUrl && (
              <Box sx={{ width: '100%', height: 300, mb: 3, borderRadius: 2, overflow: 'hidden' }}>
                <SecureImage src={news.imageUrl} alt={news.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </Box>
            )}
            
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>{news.title}</Typography>
            
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <Chip label={news.status === 'PUBLISHED' ? 'Опубліковано' : news.status === 'ARCHIVED' ? 'В архіві' : 'Чернетка'} color={news.status === 'PUBLISHED' ? 'success' : news.status === 'ARCHIVED' ? 'warning' : 'default'} size="small" />
              {news.category && <Chip label={news.category.name} size="small" variant="outlined" />}
              <Chip label={format(new Date(news.createdAt), 'dd.MM.yyyy HH:mm')} size="small" variant="outlined" />
              <Chip 
                label={`${news.author.firstName} ${news.author.lastName}`} 
                size="small" 
                variant="outlined" 
                avatar={
                  <Avatar sx={{ width: 24, height: 24 }}>
                    {news.author.avatarUrl ? <SecureImage src={news.author.avatarUrl} alt="A" /> : news.author.firstName.charAt(0)}
                  </Avatar>
                }
              />
            </Box>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Охоплення підрозділів</Typography>
            <Typography variant="body2" sx={{ mb: 3 }}>
              {news.departments?.length ? news.departments.map(d => d.name).join(', ') : 'Всі підрозділи (Загальнонаціональна)'}
            </Typography>

            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ mt: 2 }}>
              <TipTapViewer value={news.content} />
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
                <ThumbUpIcon />
                <Typography variant="h6">{news._count?.likes || 0}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
                <ThumbDownIcon />
                <Typography variant="h6">{news._count?.dislikes || 0}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'info.main' }}>
                <CommentIcon />
                <Typography variant="h6">{news._count?.comments || 0}</Typography>
              </Box>
            </Box>
          </Box>

          {/* ПРАВА ЧАСТИНА: Коментарі */}
          <Box sx={{ width: { xs: '100%', md: '35%' }, bgcolor: 'background.default', display: 'flex', flexDirection: 'column', maxHeight: '75vh' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
              <Typography variant="subtitle1">Обговорення ({comments.length})</Typography>
            </Box>
            
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {loadingComments ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress /></Box>
              ) : comments.map(comment => (
                <Box key={comment.id} sx={{ display: 'flex', gap: 1.5 }}>
                  <Avatar sx={{ width: 32, height: 32 }}>
                    {comment.author.avatarUrl ? <SecureImage src={comment.author.avatarUrl} alt="U" /> : comment.author.firstName.charAt(0)}
                  </Avatar>
                  <Box sx={{ bgcolor: 'background.paper', p: 1.5, borderRadius: 2, flexGrow: 1, border: '1px solid', borderColor: 'divider', position: 'relative' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, pr: 3 }}>
                      <Typography variant="subtitle2" sx={{ fontSize: '0.8rem' }}>
                        {comment.author.firstName} {comment.author.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(comment.createdAt), 'dd.MM.yyyy HH:mm')}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ wordBreak: 'break-word', pr: 2 }}>{comment.content}</Typography>
                    
                    <IconButton 
                      size="small" 
                      color="error" 
                      sx={{ position: 'absolute', top: 4, right: 4 }}
                      onClick={() => setCommentToDelete(comment.id)}
                    >
                      <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                </Box>
              ))}
              {!loadingComments && comments.length === 0 && (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ my: 2 }}>
                  Коментарів ще немає
                </Typography>
              )}
            </Box>

            <Box sx={{ p: 2, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Додати коментар..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={submittingComment}
              />
              <IconButton 
                color="primary" 
                onClick={handleAddComment} 
                disabled={!commentText.trim() || submittingComment}
              >
                {submittingComment ? <CircularProgress size={24} /> : <SendIcon />}
              </IconButton>
            </Box>
          </Box>
        </Box>
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