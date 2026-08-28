import { useEffect, useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, 
  Box, Chip, Divider, CircularProgress, Alert, Avatar, TextField, IconButton
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import VisibilityIcon from '@mui/icons-material/Visibility';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { projectsApi, ProjectStatus, type ProjectModel } from '../../api/projectsApi';
import { SecureImage } from '../common/SecureImage';

interface Props {
  open: boolean;
  projectId: string | null;
  onClose: () => void;
  onRefreshList: () => void;
}

export const ProjectDetailsDialog = ({ open, projectId, onClose, onRefreshList }: Props) => {
  const [project, setProject] = useState<ProjectModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchProjectDetails = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      setApiError(null);
      const data = await projectsApi.getProjectById(projectId);
      setProject(data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setApiError(err.response?.data?.message || 'Не вдалося завантажити деталі проєкту');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && projectId) {
      fetchProjectDetails();
    } else {
      setProject(null);
      setCommentText('');
      setApiError(null);
    }
  }, [open, projectId]);

  const handleAddComment = async () => {
    if (!project || !commentText.trim()) return;
    try {
      setSubmittingComment(true);
      await projectsApi.addComment(project.id, commentText);
      setCommentText('');
      fetchProjectDetails();
      onRefreshList();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setApiError(err.response?.data?.message || 'Помилка додавання коментаря');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleViewPdf = async () => {
    if (!project) return;
    try {
      const blob = await projectsApi.downloadProjectFile(project.fileUrl);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (error) {
      console.error('Failed to view document', error);
      toast.error('Не вдалося відкрити PDF документ.');
    }
  };

  if (!open) return null;

  const getStatusChip = (status: ProjectStatus) => {
    switch(status) {
      case ProjectStatus.PUBLISHED: return <Chip label="Опубліковано" color="success" size="small" />;
      case ProjectStatus.ARCHIVED: return <Chip label="В архіві" color="warning" size="small" />;
      case ProjectStatus.DRAFT: return <Chip label="Чернетка" color="default" size="small" />;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle>Деталі проєкту</DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 0 }}>
        {apiError && <Alert severity="error" sx={{ m: 2 }}>{apiError}</Alert>}
        
        {loading && !project ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : project ? (
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
            <Box sx={{ width: { xs: '100%', md: '60%' }, p: 3, borderRight: { md: 1 }, borderColor: 'divider' }}>
              <Typography variant="h5" gutterBottom>{project.title}</Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                {getStatusChip(project.status)}
                <Chip label={`Створено: ${format(new Date(project.createdAt), 'dd.MM.yyyy')}`} size="small" variant="outlined" />
                <Chip 
                  label={`Автор: ${project.author.firstName} ${project.author.lastName}`} 
                  size="small" 
                  variant="outlined" 
                  avatar={
                    <Avatar sx={{ width: 24, height: 24 }}>
                      {project.author.avatarUrl ? <SecureImage src={project.author.avatarUrl} alt="A" /> : project.author.firstName.charAt(0)}
                    </Avatar>
                  }
                />
              </Box>

              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Охоплення підрозділів</Typography>
              <Typography variant="body2" sx={{ mb: 3 }}>
                {project.departments?.length ? project.departments.map(d => d.name).join(', ') : 'Всі підрозділи (Загальнонаціональне)'}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Опис проєкту</Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {project.description}
              </Typography>
              
              <Box sx={{ mt: 3 }}>
                <Button variant="outlined" startIcon={<VisibilityIcon />} onClick={handleViewPdf}>
                  Переглянути PDF документ
                </Button>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
                  <ThumbUpIcon />
                  <Typography variant="h6">{project.upvotes || 0}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
                  <ThumbDownIcon />
                  <Typography variant="h6">{project.downvotes || 0}</Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ width: { xs: '100%', md: '40%' }, bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
                <Typography variant="subtitle1">Обговорення ({project.comments?.length || 0})</Typography>
              </Box>
              
              <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 400 }}>
                {project.comments?.map(comment => (
                  <Box key={comment.id} sx={{ display: 'flex', gap: 1.5 }}>
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {comment.author.avatarUrl ? <SecureImage src={comment.author.avatarUrl} alt="U" /> : comment.author.firstName.charAt(0)}
                    </Avatar>
                    <Box sx={{ bgcolor: 'background.paper', p: 1.5, borderRadius: 2, flexGrow: 1, border: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontSize: '0.8rem' }}>
                          {comment.author.firstName} {comment.author.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(comment.createdAt), 'dd.MM.yyyy HH:mm')}
                        </Typography>
                      </Box>
                      <Typography variant="body2">{comment.content}</Typography>
                    </Box>
                  </Box>
                ))}
                {!project.comments?.length && (
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
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">Закрити</Button>
      </DialogActions>
    </Dialog>
  );
};