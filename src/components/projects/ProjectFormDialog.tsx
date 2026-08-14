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
import { projectsApi, ProjectStatus, type ProjectModel } from '../../api/projectsApi';
import { DepartmentAutocomplete } from '../common/DepartmentAutocomplete';
import type { Department } from '../../api/departmentsApi';

const projectSchema = z.object({
  title: z.string().min(3, 'Мінімум 3 символи'),
  description: z.string().min(10, 'Опис має бути не менше 10 символів'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  departmentIds: z.array(z.string()).optional(),
});

type FormInputs = z.infer<typeof projectSchema>;

interface Props {
  open: boolean;
  project: ProjectModel | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProjectFormDialog = ({ open, project, onClose, onSuccess }: Props) => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedDepartments, setSelectedDepartments] = useState<Department[]>([]);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormInputs>({
    resolver: zodResolver(projectSchema),
    defaultValues: { title: '', description: '', status: 'DRAFT', departmentIds: [] },
  });

  useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;

    const loadPreview = async () => {
      if (selectedFile) {
        objectUrl = URL.createObjectURL(selectedFile);
        if (isMounted) {
          setPreviewUrl(objectUrl);
          setLoadingPreview(false);
        }
      } else if (project) {
        setLoadingPreview(true);
        try {
          const blob = await projectsApi.downloadProjectFile(project.fileUrl);
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
      } else {
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
  }, [selectedFile, project, open]);

  useEffect(() => {
    if (open) {
      setApiError(null);
      setSelectedFile(null);
      if (project) {
        setSelectedDepartments(project.departments || []);
        reset({
          title: project.title,
          description: project.description,
          status: project.status,
          departmentIds: project.departments.map(d => d.id),
        });
      } else {
        setSelectedDepartments([]);
        reset({ title: '', description: '', status: 'DRAFT', departmentIds: [] });
      }
    }
  }, [open, project, reset]);

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
      
      if (project) {
        await projectsApi.updateProject(project.id, {
          title: data.title,
          description: data.description,
          status: data.status,
          departmentIds: data.departmentIds,
        });

        if (selectedFile) {
          await projectsApi.updateProjectFile(project.id, selectedFile);
        }
      } else {
        if (!selectedFile) {
          setApiError('Будь ласка, оберіть PDF файл для завантаження проєкту.');
          return;
        }
        await projectsApi.createProject({
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
      setApiError(err.response?.data?.message || 'Не вдалося зберегти проєкт');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth scroll="paper">
      <DialogTitle sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{project ? 'Редагувати проєкт' : 'Новий проєкт'}</Typography>
          <IconButton onClick={onClose} size="small" disabled={isSubmitting}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, height: '75vh' }}>
            
            <Box sx={{ width: { xs: '100%', md: '35%' }, p: 3, overflowY: 'auto', borderRight: { md: 1 }, borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 3 }}>
              {apiError && <Alert severity="error">{apiError}</Alert>}
              
              <Controller name="title" control={control} render={({ field }) => (
                <TextField {...field} label="Назва проєкту" error={!!errors.title} helperText={errors.title?.message} fullWidth autoFocus />
              )}/>

              <Controller name="description" control={control} render={({ field }) => (
                <TextField {...field} label="Детальний опис" multiline rows={6} error={!!errors.description} helperText={errors.description?.message} fullWidth />
              )}/>

              <Controller name="status" control={control} render={({ field }) => (
                <TextField {...field} select label="Статус" fullWidth error={!!errors.status} helperText={errors.status?.message}>
                  <MenuItem value="DRAFT">Чернетка</MenuItem>
                  <MenuItem value="PUBLISHED">Опубліковано</MenuItem>
                </TextField>
              )}/>

              <Box>
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
                    placeholder={selectedDepartments.length === 0 ? "Всі підрозділи (Загальнонаціональний)" : ""}
                  />
                )}/>
              </Box>
            </Box>

            <Box sx={{ width: { xs: '100%', md: '65%' }, bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
              
              <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  PDF Документ проєкту {selectedFile ? '(Обрано новий файл)' : ''}
                </Typography>
                <Box>
                  <input type="file" hidden accept="application/pdf" ref={fileInputRef} onChange={handleFileChange} />
                  <Button 
                    size="small" 
                    variant={project || selectedFile ? "outlined" : "contained"} 
                    startIcon={<FileUploadIcon />} 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {project || selectedFile ? 'Змінити файл' : 'Обрати файл'}
                  </Button>
                </Box>
              </Box>

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
                    <Typography>Файл проєкту не обрано</Typography>
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
            {isSubmitting ? 'Збереження...' : (project ? 'Зберегти зміни' : 'Створити та завантажити')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};