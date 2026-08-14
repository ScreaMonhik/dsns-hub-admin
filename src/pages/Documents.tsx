import { useEffect, useState, useCallback } from 'react';
import { 
  Box, Typography, Button, Paper, Pagination, CircularProgress,
  IconButton, Tooltip, Chip, MenuItem, TextField, Card, CardContent, CardActions, Tabs, Tab
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import PublicIcon from '@mui/icons-material/Public';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import { documentsApi, DocumentStatus, type DocumentModel, type PaginatedDocumentsResponse } from '../api/documentsApi';
import type { Department } from '../api/departmentsApi';
import { DepartmentAutocomplete } from '../components/common/DepartmentAutocomplete';
import { DocumentFormDialog } from '../components/documents/DocumentFormDialog';
import { DocumentStatusDialog } from '../components/documents/DocumentStatusDialog';
import { DeleteDocumentDialog } from '../components/documents/DeleteDocumentDialog';
import { format } from 'date-fns';

export const Documents = () => {
  const [data, setData] = useState<PaginatedDocumentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState(0); 
  const [page, setPage] = useState(1);
  const [filterDepartment, setFilterDepartment] = useState<Department | null>(null);
  const [filterStatus, setFilterStatus] = useState<DocumentStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editDocument, setEditDocument] = useState<DocumentModel | null>(null);
  const [deleteDocumentItem, setDeleteDocumentItem] = useState<DocumentModel | null>(null);
  const [statusDialogData, setStatusDialogData] = useState<{ document: DocumentModel, action: 'publish' | 'archive' | 'unarchive' } | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const targetStatus = activeTab === 1 ? DocumentStatus.ARCHIVED : (filterStatus || undefined);
      const res = await documentsApi.getDocuments(page, 10, filterDepartment?.id || undefined, targetStatus, debouncedSearch);
      setData(res);
    } catch (error) {
      console.error('Failed to fetch documents', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, filterDepartment, filterStatus, activeTab, debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setFilterStatus('');
    setPage(1);
  };

  const getStatusChip = (status: DocumentStatus) => {
    switch(status) {
      case DocumentStatus.PUBLISHED: return <Chip label="Опубліковано" color="success" size="small" />;
      case DocumentStatus.ARCHIVED: return <Chip label="В архіві" color="warning" size="small" />;
      case DocumentStatus.DRAFT: return <Chip label="Чернетка" color="default" size="small" />;
    }
  };

  const handleViewDocument = async (doc: DocumentModel) => {
    try {
      setDownloadingId(doc.id);
      const blob = await documentsApi.downloadDocument(doc.fileUrl);
      
      // Створюємо URL і відкриваємо в новій вкладці для перегляду
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      window.open(url, '_blank');
      
      // Очищаємо пам'ять через хвилину, щоб браузер встиг завантажити PDF у новій вкладці
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (error) {
      console.error('Failed to view document', error);
      alert('Не вдалося відкрити документ для перегляду.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Фільтруємо архівні документи на фронтенді для вкладки "Активні", 
  // оскільки бекенд при status=undefined повертає записи всіх статусів
  const docsList = data?.data?.filter(item => activeTab === 0 ? item.status !== DocumentStatus.ARCHIVED : true) || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Нормативні документи</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditDocument(null); setIsFormOpen(true); }}>
          Додати документ
        </Button>
      </Box>

      <Paper sx={{ width: '100%', mb: 2, p: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tab label="Активні / Чернетки" />
          <Tab label="Архів" />
        </Tabs>

        <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Пошук за назвою..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                }
              }}
              sx={{ minWidth: 200 }}
            />
            <Box sx={{ minWidth: 200 }}>
              <DepartmentAutocomplete
                size="small"
                label="Підрозділ"
                value={filterDepartment}
                onChange={(_, val) => { setFilterDepartment(val as Department | null); setPage(1); }}
                placeholder="Всі підрозділи"
              />
            </Box>
            
            {activeTab === 0 && (
              <TextField select size="small" label="Статус" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value as DocumentStatus | ''); setPage(1); }} sx={{ minWidth: 160 }}>
                <MenuItem value="">Всі активні</MenuItem>
                <MenuItem value={DocumentStatus.PUBLISHED}>Опубліковані</MenuItem>
                <MenuItem value={DocumentStatus.DRAFT}>Чернетки</MenuItem>
              </TextField>
            )}
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 2 }}>
            {docsList.map((item) => (
              <Card 
                key={item.id}
                onDoubleClick={() => {
                  if (activeTab === 0) {
                    setEditDocument(item);
                    setIsFormOpen(true);
                  }
                }}
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease', 
                  '&:hover': { 
                    transform: 'translateY(-4px)', 
                    boxShadow: 6, 
                    cursor: activeTab === 0 ? 'pointer' : 'default' 
                  } 
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', mb: 1.5 }}>
                    <Box sx={{ p: 1, bgcolor: 'error.main', color: 'error.contrastText', borderRadius: 1, display: 'flex' }}>
                      <PictureAsPdfIcon />
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontSize: '1.05rem', lineHeight: 1.2, mb: 0.5 }}>{item.title}</Typography>
                      {getStatusChip(item.status)}
                    </Box>
                  </Box>
                  
                  {item.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.description}
                    </Typography>
                  )}
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 'auto' }}>
                    <Typography variant="caption" component="div" color="text.secondary">
                      Охоплення: {item.departments?.length ? item.departments.map(d => d.name).join(', ') : 'Для всіх підрозділів'}
                    </Typography>
                    
                    <Typography variant="caption" component="div" color="text.disabled">
                      Оновлено: {format(new Date(item.updatedAt), 'dd.MM.yyyy HH:mm')}
                    </Typography>
                  </Box>
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'space-between', borderTop: 1, borderColor: 'divider', px: 2 }}>
                  <Button 
                    size="small" 
                    startIcon={downloadingId === item.id ? <CircularProgress size={14} /> : <VisibilityIcon />} 
                    onClick={() => handleViewDocument(item)}
                    disabled={downloadingId === item.id}
                  >
                    Переглянути
                  </Button>
                  <Box>
                    {item.status === DocumentStatus.DRAFT && (
                      <>
                        <Tooltip title="Опублікувати"><IconButton size="small" color="success" onClick={() => setStatusDialogData({ document: item, action: 'publish' })}><PublicIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Редагувати"><IconButton size="small" color="primary" onClick={() => { setEditDocument(item); setIsFormOpen(true); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="В архів"><IconButton size="small" color="warning" onClick={() => setStatusDialogData({ document: item, action: 'archive' })}><ArchiveIcon fontSize="small" /></IconButton></Tooltip>
                      </>
                    )}
                    {item.status === DocumentStatus.PUBLISHED && (
                      <Tooltip title="В архів"><IconButton size="small" color="warning" onClick={() => setStatusDialogData({ document: item, action: 'archive' })}><ArchiveIcon fontSize="small" /></IconButton></Tooltip>
                    )}
                    {item.status === DocumentStatus.ARCHIVED && (
                      <Tooltip title="Відновити в чернетки"><IconButton size="small" color="success" onClick={() => setStatusDialogData({ document: item, action: 'unarchive' })}><UnarchiveIcon fontSize="small" /></IconButton></Tooltip>
                    )}
                    <Tooltip title="Видалити"><IconButton size="small" color="error" onClick={() => setDeleteDocumentItem(item)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </Box>
                </CardActions>
              </Card>
            ))}
            {docsList.length === 0 && <Typography sx={{ gridColumn: '1 / -1', textAlign: 'center', py: 4 }}>Документів не знайдено</Typography>}
          </Box>
        )}
        
        {data && (data.meta?.lastPage || 0) > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2, pt: 3 }}>
            <Pagination count={data.meta.lastPage} page={page} onChange={(_, val) => setPage(val)} color="primary" />
          </Box>
        )}
      </Paper>

      <DocumentFormDialog open={isFormOpen} document={editDocument} onClose={() => setIsFormOpen(false)} onSuccess={fetchData} />
      <DeleteDocumentDialog open={!!deleteDocumentItem} document={deleteDocumentItem} onClose={() => setDeleteDocumentItem(null)} onSuccess={fetchData} />
      <DocumentStatusDialog 
        open={!!statusDialogData} 
        document={statusDialogData?.document || null} 
        action={statusDialogData?.action || null} 
        onClose={() => setStatusDialogData(null)} 
        onSuccess={fetchData} 
      />
    </Box>
  );
};