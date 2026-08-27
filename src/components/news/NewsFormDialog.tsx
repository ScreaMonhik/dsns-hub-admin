import { useEffect, useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, MenuItem, Box, Alert, Typography,
  CircularProgress, IconButton, Tooltip, Autocomplete, Divider, Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { newsApi, type News, type NewsCategory } from '../../api/newsApi';
import { TipTapEditor, TipTapViewer } from './TipTapEditor';
import { CreateCategoryDialog } from './CreateCategoryDialog';
import { ManageCategoriesDialog } from './ManageCategoriesDialog';
import { SecureImage } from '../common/SecureImage';
import { DepartmentAutocomplete } from '../common/DepartmentAutocomplete';
import type { Department } from '../../api/departmentsApi';
import SettingsIcon from '@mui/icons-material/Settings';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { uk } from 'date-fns/locale';
import { format } from 'date-fns';

const newsSchema = z.object({
  title: z.string().min(3, 'Мінімум 3 символи'),
  content: z.string().min(10, 'Контент занадто короткий'),
  categoryId: z.string().nullable(),
  departmentIds: z.array(z.string()).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED']),
  publishedAt: z.string().nullable().optional(),
  imageUrl: z.string().nullable(),
}).superRefine((data, ctx) => {
  if (data.status === 'SCHEDULED' && !data.publishedAt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Обов'язково вкажіть дату та час для запланованої публікації",
      path: ['publishedAt'],
    });
  }
});

type FormInputs = z.infer<typeof newsSchema>;

interface Props {
  open: boolean;
  news: News | null;
  categories: NewsCategory[];
  onClose: () => void;
  onSuccess: () => void;
  onRefreshCategories?: () => void;
}

export const NewsFormDialog = ({ open, news, categories, onClose, onSuccess, onRefreshCategories }: Props) => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [selectedDepartments, setSelectedDepartments] = useState<Department[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { control, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormInputs>({
    resolver: zodResolver(newsSchema),
    defaultValues: { title: '', content: '', categoryId: null, departmentIds: [], status: 'DRAFT', publishedAt: null, imageUrl: null },
  });

  const coverUrl = watch('imageUrl');
  const liveTitle = watch('title');
  const liveContent = watch('content');
  const liveCategoryId = watch('categoryId');
  const livePublishedAt = watch('publishedAt');
  const liveStatus = watch('status');
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open && !wasOpen.current) {
      if (news) {
        setSelectedDepartments(news.departments || []);
        reset({
          title: news.title,
          content: news.content,
          categoryId: news.categoryId,
          departmentIds: news.departments?.map(d => d.id) || [],
          status: news.status,
          publishedAt: news.publishedAt ? new Date(news.publishedAt).toISOString() : null,
          imageUrl: news.imageUrl,
        });
      } else {
        setSelectedDepartments([]);
        reset({ title: '', content: '', categoryId: null, departmentIds: [], status: 'DRAFT', publishedAt: null, imageUrl: null });
      }
    }
    wasOpen.current = open;
  }, [news, open, reset, categories]);

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingCover(true);
      const res = await newsApi.uploadMedia(file);
      setValue('imageUrl', res.url);
    } catch (err: any) {
      if (err.response?.status === 400) {
        setApiError('Файл пошкоджено або має непідтримуваний формат.');
      } else {
        setApiError('Помилка завантаження обкладинки');
      }
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
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth scroll="paper">
      <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}>
        {news ? 'Редагувати новину' : 'Створити новину'}
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, height: '80vh' }}>
            
            {/* ЛІВА ПАНЕЛЬ: Форма */}
            <Box sx={{ width: { xs: '100%', lg: '65%' }, p: 3, overflowY: 'auto', borderRight: { lg: 1 }, borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 3 }}>
              {apiError && <Alert severity="error">{apiError}</Alert>}
              
              <Controller name="title" control={control} render={({ field }) => (
            <TextField {...field} label="Заголовок" error={!!errors.title} helperText={errors.title?.message} fullWidth />
          )}/>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Box sx={{ display: 'flex', gap: 0.5, flex: 1, alignItems: 'flex-start' }}>
              <Controller name="categoryId" control={control} render={({ field }) => (
                <Autocomplete
                  options={categories}
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, value) => option.id === value?.id}
                  value={categories.find(c => c.id === field.value) || null}
                  onChange={(_, newValue) => {
                    field.onChange(newValue ? newValue.id : null);
                  }}
                  renderInput={(params) => (
                    <TextField 
                      {...params}
                      label="Категорія" 
                      error={!!errors.categoryId} 
                      helperText={errors.categoryId?.message}
                      placeholder="Без категорії"
                    />
                  )}
                  fullWidth
                />
              )}/>
              <Tooltip title="Додати нову категорію">
                <IconButton onClick={() => setIsCreateCategoryOpen(true)} sx={{ mt: 0.5, color: 'action.active' }}>
                  <AddIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Управління категоріями">
                <IconButton onClick={() => setIsManageCategoriesOpen(true)} sx={{ mt: 0.5, color: 'action.active' }}>
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
            </Box>

            <Box sx={{ flex: 1 }}>
              <Controller name="status" control={control} render={({ field: { onChange, value, ...restField } }) => (
                <TextField 
                  {...restField} 
                  value={value}
                  select 
                  label="Статус" 
                  fullWidth 
                  error={!!errors.status} 
                  helperText={errors.status?.message}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    onChange(newStatus);
                    if (newStatus === 'DRAFT') {
                      setValue('publishedAt', null, { shouldValidate: true });
                    }
                  }}
                >
                  <MenuItem value="DRAFT">Чернетка</MenuItem>
                  <MenuItem value="SCHEDULED">Заплановано</MenuItem>
                  <MenuItem value="PUBLISHED">Опубліковано</MenuItem>
                </TextField>
              )}/>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Відкладена публікація {liveStatus === 'SCHEDULED' ? '(обов\'язково)' : '(опціонально)'}
              </Typography>
              <Controller name="publishedAt" control={control} render={({ field: { onChange, value, ...restField } }) => (
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={uk}>
                  <DateTimePicker
                    {...restField}
                    label="Дата та час публікації"
                    value={value ? new Date(value) : null}
                    disablePast
                    onChange={(newValue) => {
                      onChange(newValue ? (newValue as Date).toISOString() : null);
                      if (newValue) {
                        setValue('status', 'SCHEDULED', { shouldValidate: true });
                      } else {
                        setValue('status', 'DRAFT', { shouldValidate: true });
                      }
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                        error: !!errors.publishedAt,
                        helperText: errors.publishedAt?.message || 'Якщо вказано - новина опублікується автоматично.',
                      }
                    }}
                  />
                </LocalizationProvider>
              )}/>
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Охоплення підрозділів (опціонально)</Typography>
              <Controller name="departmentIds" control={control} render={({ field }) => (
                <DepartmentAutocomplete
                  multiple
                  value={selectedDepartments}
                  onChange={(_, newValue) => {
                    const values = newValue as Department[];
                    setSelectedDepartments(values);
                    field.onChange(values.map(d => d.id));
                  }}
                  placeholder={selectedDepartments.length === 0 ? "Всі підрозділи (Загальнонаціональна новина)" : ""}
                />
              )}/>
            </Box>
          </Box> {/* ДОДАНО ПРОПУЩЕНИЙ ЗАКРИВАЮЧИЙ ТЕГ */}

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Обкладинка новини</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button variant="outlined" component="label" disabled={isUploadingCover}>
                {isUploadingCover ? <CircularProgress size={24} /> : 'Обрати файл'}
                <input type="file" hidden accept="image/jpeg, image/png" onChange={handleCoverUpload} ref={fileInputRef} />
              </Button>
              {coverUrl && (
  <Box sx={{ position: 'relative', width: 100, height: 60 }}>
    <SecureImage 
      src={coverUrl} 
      alt="Cover" 
      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }} 
    />
    <IconButton 
      size="small" 
      color="error" 
      sx={{ position: 'absolute', top: -10, right: -10, bgcolor: 'background.paper' }} 
      onClick={() => setValue('imageUrl', null)}
    >
      <DeleteIcon fontSize="small" />
    </IconButton>
  </Box>
)}
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Текст новини 
              <Typography component="span" variant="caption" color="warning.main" sx={{ ml: 1 }}>
                (Увага: Небезпечні HTML-теги будуть автоматично вирізані після збереження)
              </Typography>
            </Typography>
            <Controller name="content" control={control} render={({ field }) => (
              <TipTapEditor value={field.value} onChange={field.onChange} error={!!errors.content} />
            )}/>
            {errors.content && <Typography variant="caption" color="error">{errors.content.message}</Typography>}
          </Box>
        </Box>

        {/* ПРАВА ПАНЕЛЬ: Live Preview (Mobile Emulator) */}
        <Box sx={{ width: { xs: '100%', lg: '35%' }, bgcolor: 'background.default', p: 3, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflowY: 'auto' }}>
          
          <Box sx={{ 
            width: 360, 
            minHeight: 700, 
            bgcolor: 'background.paper', 
            borderRadius: '40px', 
            border: '12px solid #0f172a', 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', 
            position: 'relative', 
            overflow: 'hidden', 
            display: 'flex', 
            flexDirection: 'column' 
          }}>
            {/* Notch (Виріз екрану) */}
            <Box sx={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 140, height: 28, bgcolor: '#0f172a', borderBottomLeftRadius: 16, borderBottomRightRadius: 16, zIndex: 10 }} />
            
            {/* Status Bar */}
            <Box sx={{ height: 44, width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, pt: 1, color: 'text.primary', bgcolor: 'background.paper', zIndex: 5 }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
                {format(new Date(), 'HH:mm')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                <Box sx={{ width: 16, height: 10, bgcolor: 'text.primary', borderRadius: 0.5, opacity: 0.8 }} />
                <Box sx={{ width: 14, height: 10, bgcolor: 'text.primary', borderRadius: 2, opacity: 0.8 }} />
              </Box>
            </Box>

            {/* Mobile Header */}
            <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1.5 }}>
                <Typography variant="caption" sx={{ fontSize: '10px' }}>←</Typography>
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, flexGrow: 1, textAlign: 'center', mr: 3 }}>
                Новини DSNS
              </Typography>
            </Box>

            {/* Mobile Content (Preview) */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
              {liveStatus === 'DRAFT' && (
                <Alert severity="warning" sx={{ mb: 2, py: 0, '& .MuiAlert-message': { fontSize: '0.75rem' } }}>
                  Режим чернетки (невидимо)
                </Alert>
              )}
              {liveStatus === 'SCHEDULED' && (
                <Alert severity="info" sx={{ mb: 2, py: 0, '& .MuiAlert-message': { fontSize: '0.75rem' } }}>
                  Буде опубліковано автоматично
                </Alert>
              )}
              
              {coverUrl ? (
                <SecureImage 
                  src={coverUrl} 
                  alt="Cover" 
                  style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: '12px', marginBottom: '16px' }} 
                />
              ) : (
                <Box sx={{ width: '100%', height: 160, bgcolor: 'divider', borderRadius: '12px', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="caption" color="text.secondary">Обкладинка відсутня</Typography>
                </Box>
              )}
              
              <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label={liveCategoryId && categories ? (categories.find(c => c.id === liveCategoryId)?.name || 'Без категорії') : 'Без категорії'} 
                  size="small" 
                  sx={{ fontSize: '0.65rem', height: 20, bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 600 }} 
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', fontSize: '0.7rem' }}>
                  {livePublishedAt ? format(new Date(livePublishedAt), 'dd.MM.yyyy HH:mm') : format(new Date(), 'dd.MM.yyyy HH:mm')}
                </Typography>
              </Box>

              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, lineHeight: 1.3, fontSize: '1.25rem', wordBreak: 'break-word', color: 'text.primary' }}>
                {liveTitle || 'Заголовок новини відображатиметься тут'}
              </Typography>
              
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{
                color: 'text.primary',
                '& .ProseMirror': { fontSize: '0.95rem', lineHeight: 1.6, color: 'inherit' },
                '& img': { maxWidth: '100%', borderRadius: '8px', my: 1 },
                '& iframe': { maxWidth: '100%', borderRadius: '8px', my: 1 },
                '& p': { mb: 1.5 },
                '& h2, & h3': { mt: 2, mb: 1, fontWeight: 700 }
              }}>
                {liveContent ? <TipTapViewer value={liveContent} /> : <Typography variant="body2" color="text.disabled">Текст новини...</Typography>}
              </Box>
            </Box>
            
          </Box>
        </Box>
        
        </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={onClose} disabled={isSubmitting}>Скасувати</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Збереження...' : (news ? 'Зберегти зміни' : 'Створити')}
          </Button>
        </DialogActions>
      </Box>

      <CreateCategoryDialog
        open={isCreateCategoryOpen}
        onClose={() => setIsCreateCategoryOpen(false)}
        onSuccess={(newId) => {
          if (onRefreshCategories) {
            onRefreshCategories();
          }
          setValue('categoryId', newId);
        }}
      />

      <ManageCategoriesDialog
        open={isManageCategoriesOpen}
        categories={categories}
        onClose={() => setIsManageCategoriesOpen(false)}
        onRefresh={() => {
          if (onRefreshCategories) {
            onRefreshCategories();
          }
        }}
      />
    </Dialog>
  );
};