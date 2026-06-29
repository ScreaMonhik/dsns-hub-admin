import { useEffect, useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, MenuItem, Box, Alert, Typography,
  CircularProgress, IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { newsApi, type NewsStatus, type News, type NewsCategory } from '../../api/newsApi';
import { TipTapEditor } from './TipTapEditor';

const newsSchema = z.object({
  title: z.string().min(3, 'Мінімум 3 символи'),
  content: z.string().min(10, 'Контент занадто короткий'),
  categoryId: z.string().nullable(),
  status: z.enum(['DRAFT', 'PUBLISHED']),
  imageUrl: z.string().nullable(),
});

type FormInputs = z.infer<typeof newsSchema>;

interface Props {
  open: boolean;
  news: News | null;
  categories: NewsCategory[];
  onClose: () => void;
  onSuccess: () => void;
}

const getFullUrl = (path: string) => 
  path.startsWith('http') ? path : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${path}`;

export const NewsFormDialog = ({ open, news, categories, onClose, onSuccess }: Props) => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { control, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormInputs>({
    resolver: zodResolver(newsSchema),
    defaultValues: { title: '', content: '', categoryId: null, status: 'DRAFT', imageUrl: null },
  });

  const coverUrl = watch('imageUrl');

  useEffect(() => {
    if (open) {
      if (news) {
        reset({
          title: news.title,
          content: news.content,
          categoryId: news.categoryId,
          status: news.status,
          imageUrl: news.imageUrl,
        });
      } else {
        reset({ title: '', content: '', categoryId: categories[0]?.id || null, status: 'DRAFT', imageUrl: null });
      }
    }
  }, [news, open, reset, categories]);

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingCover(true);
      const res = await newsApi.uploadMedia(file);
      setValue('imageUrl', res.url);
    } catch (err) {
      setApiError('Помилка завантаження обкладинки');
    } finally {
      setIsUploadingCover(false);
    }
  };

  const onSubmit = async (data: FormInputs) => {
    try {
      setApiError(null);
      if (news) {
        await newsApi.updateNews(news.id, data);
      } else {
        await newsApi.createNews(data);
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      setApiError(error.response?.data?.message || 'Не вдалося зберегти новину');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{news ? 'Редагувати новину' : 'Створити новину'}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {apiError && <Alert severity="error">{apiError}</Alert>}
          
          <Controller name="title" control={control} render={({ field }) => (
            <TextField {...field} label="Заголовок" error={!!errors.title} helperText={errors.title?.message} fullWidth />
          )}/>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Controller name="categoryId" control={control} render={({ field }) => (
              <TextField {...field} select label="Категорія" fullWidth error={!!errors.categoryId} helperText={errors.categoryId?.message} value={field.value || ''}>
                <MenuItem value=""><em>Без категорії</em></MenuItem>
                {categories.map((cat) => <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>)}
              </TextField>
            )}/>
            <Controller name="status" control={control} render={({ field }) => (
              <TextField {...field} select label="Статус" fullWidth error={!!errors.status} helperText={errors.status?.message}>
                <MenuItem value="DRAFT">Чернетка (DRAFT)</MenuItem>
                <MenuItem value="PUBLISHED">Опубліковано (PUBLISHED)</MenuItem>
              </TextField>
            )}/>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Обкладинка новини</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button variant="outlined" component="label" disabled={isUploadingCover}>
                {isUploadingCover ? <CircularProgress size={24} /> : 'Обрати файл'}
                <input type="file" hidden accept="image/jpeg, image/png" onChange={handleCoverUpload} ref={fileInputRef} />
              </Button>
              {coverUrl && (
                <Box sx={{ position: 'relative', width: 100, height: 60 }}>
                  <img src={getFullUrl(coverUrl)} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }} />
                  <IconButton size="small" color="error" sx={{ position: 'absolute', top: -10, right: -10, bgcolor: 'background.paper' }} onClick={() => setValue('imageUrl', null)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Текст новини</Typography>
            <Controller name="content" control={control} render={({ field }) => (
              <TipTapEditor value={field.value} onChange={field.onChange} error={!!errors.content} />
            )}/>
            {errors.content && <Typography variant="caption" color="error">{errors.content.message}</Typography>}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={isSubmitting}>Скасувати</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Збереження...' : (news ? 'Зберегти зміни' : 'Створити')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};