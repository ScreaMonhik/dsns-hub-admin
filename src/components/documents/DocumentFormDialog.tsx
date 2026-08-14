import { useEffect, useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Box, Alert, Typography, MenuItem, CircularProgress, IconButton
} from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CloseIcon from '@mui/icons-material/Close';
import { documentsApi, DocumentStatus, type DocumentModel } from '../../api/documentsApi';
import { DepartmentAutocomplete } from '../common/DepartmentAutocomplete';
import type { Department } from '../../api/departmentsApi';

const documentSchema = z.object({
  title: z.string().min(3, 'Мінімум 3 символи'),
  description: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  departmentIds: z.array(z.string()).optional(),
});

type FormInputs = z.infer<typeof documentSchema>;

interface Props {
  open: boolean;
  document: DocumentModel | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const DocumentFormDialog = ({ open, document, onClose, onSuccess }: Props) => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedDepartments, setSelectedDepartments] = useState<Department[]>([]);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormInputs>({
    resolver: zodResolver(documentSchema),
    defaultValues: { title: '', description: '', status: 'DRAFT', departmentIds: [] },
  });

  // Завантаження початкових даних та формування прев'ю
  useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;

    const loadPreview = async () => {
      // 1. Пріоритет: Новий вибраний файл користувачем
      if (selectedFile) {
        objectUrl = URL.createObjectURL(selectedFile);
        if (isMounted) {
          setPreviewUrl(objectUrl);
          setLoadingPreview(false);
        }
      } 
      // 2. Якщо є існуючий документ (режим редагування)
      else if (document) {
        setLoadingPreview(true);
        try {
          const blob = await documentsApi.downloadDocument(document.fileUrl);
          objectUrl = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
          if (isMounted) {
            setPreviewUrl(objectUrl);
          }
        } catch (error) {
          console.error('Preview error', error);
          if (isMounted) setApiError('Не вдалося завантажити прев\'ю документа');
        } finally {
          if (isMounted) setLoadingPreview(false);
        }
      } 
      // 3. Створення нового документа без файлу
      else {
        if (isMounted) {
          setPreviewUrl(null);
          setLoadingPreview(false);
        }
      }
    };

    if (open) {
      loadPreview();
    }

    return () => {
      isMounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile, document, open]);

  // Скидання форми при відкритті/закритті
  useEffect(() => {
    if (open) {
      setApiError(null);
      setSelectedFile(null);
      if (document) {
        setSelectedDepartments(document.departments || []);
        reset({
          title: document.title,
          description: document.description || '',
          status: document.status,
          departmentIds: document.departments.map(d => d.id),
        });
      } else {
        setSelectedDepartments([]);
        reset({ title: '', description: '', status: 'DRAFT', departmentIds: [] });
      }
    }
  }, [open, document, reset]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        setApiError('Дозволено завантажувати лише PDF файли.');
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setApiError('Максимальний розмір файлу 20MB.');
        return;
      }
      setSelectedFile(file);
      setApiError(null);
    }
  };

  const onSubmit = async (data: FormInputs) => {
    try {
      setApiError(null);
      
      if (document) {
        // 1. Оновлюємо метадані (JSON)
        await documentsApi.updateDocument(document.id, {
          title: data.title,
          description: data.description,
          status: data.status,
          departmentIds: data.departmentIds,
        });

        // 2. Якщо користувач обрав новий файл на заміну, завантажуємо його
        if (selectedFile) {
          await documentsApi.updateDocumentFile(document.id, selectedFile);
        }
      } else {
        // Створення повністю нового запису (файл обов'язковий)
        if (!selectedFile) {
          setApiError('Будь ласка, оберіть PDF файл для завантаження.');
          return;
        }
        await documentsApi.createDocument({
          file: selectedFile,
          title: data.title,
          description: data.description,
          status: data.status,
          departmentIds: data.departmentIds,
        });
      }
      
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setApiError(err.response?.data?.message || 'Не вдалося зберегти документ');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth scroll="paper">
      <DialogTitle sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{document ? 'Редагувати документ' : 'Новий документ'}</Typography>
          <IconButton onClick={onClose} size="small" disabled={isSubmitting}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, height: '75vh' }}>
            
            {/* ЛІВА ПАНЕЛЬ: Форма метаданих */}
            <Box sx={{ width: { xs: '100%', md: '35%' }, p: 3, overflowY: 'auto', borderRight: { md: 1 }, borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 3 }}>
              {apiError && <Alert severity="error">{apiError}</Alert>}
              
              <Controller name="title" control={control} render={({ field }) => (
                <TextField {...field} label="Назва документа" error={!!errors.title} helperText={errors.title?.message} fullWidth autoFocus />
              )}/>

              <Controller name="description" control={control} render={({ field }) => (
                <TextField {...field} label="Опис (необов'язково)" multiline rows={4} fullWidth />
              )}/>

              <Controller name="status" control={control} render={({ field }) => (
                <TextField {...field} select label="Статус" fullWidth error={!!errors.status} helperText={errors.status?.message}>
                  <MenuItem value="DRAFT">Чернетка</MenuItem>
                  <MenuItem value="PUBLISHED">Опубліковано</MenuItem>
                </TextField>
              )}/>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Охоплення підрозділів</Typography>
                <Controller name="departmentIds" control={control} render={({ field }) => (
                  <DepartmentAutocomplete
                    multiple
                    value={selectedDepartments}
                    onChange={(_, newValue) => {
                      const values = newValue as Department[];
                      setSelectedDepartments(values);
                      field.onChange(values.map(d => d.id));
                    }}
                    placeholder={selectedDepartments.length === 0 ? "Всі підрозділи (Загальнонаціональний)" : ""}
                  />
                )}/>
              </Box>
            </Box>

            {/* ПРАВА ПАНЕЛЬ: Перегляд та управління PDF */}
            <Box sx={{ width: { xs: '100%', md: '65%' }, bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
              
              {/* Toolbar над прев'ю */}
              <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Перегляд PDF {selectedFile ? '(Обрано новий файл)' : ''}
                </Typography>
                <Box>
                  <input type="file" hidden accept="application/pdf" ref={fileInputRef} onChange={handleFileChange} />
                  <Button 
                    size="small" 
                    variant={document || selectedFile ? "outlined" : "contained"} 
                    startIcon={<FileUploadIcon />} 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {document || selectedFile ? 'Змінити файл' : 'Обрати файл'}
                  </Button>
                </Box>
              </Box>

              {/* Зона самого прев'ю */}
              <Box sx={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
                {loadingPreview ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress />
                  </Box>
                ) : previewUrl ? (
                  <iframe src={previewUrl} width="100%" height="100%" style={{ border: 'none', display: 'block' }} title="PDF Preview" />
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'text.secondary', gap: 2 }}>
                    <PictureAsPdfIcon sx={{ fontSize: 64, opacity: 0.3 }} />
                    <Typography>Файл не обрано</Typography>
                    <Button variant="contained" onClick={() => fileInputRef.current?.click()}>
                      Завантажити PDF
                    </Button>
                  </Box>
                )}
              </Box>

            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={onClose} disabled={isSubmitting}>Скасувати</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Збереження...' : (document ? 'Зберегти зміни' : 'Створити та завантажити')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};