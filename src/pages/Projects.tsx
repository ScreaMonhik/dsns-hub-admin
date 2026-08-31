import { useEffect, useState, useCallback } from 'react';
import { 
  Box, Typography, Button, Paper, Pagination, CircularProgress,
  IconButton, Tooltip, Chip, MenuItem, TextField, Card, CardContent, CardActions, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, ToggleButton, ToggleButtonGroup, Avatar, Skeleton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ViewListIcon from '@mui/icons-material/ViewList';
import GridViewIcon from '@mui/icons-material/GridView';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import PublicIcon from '@mui/icons-material/Public';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import CommentIcon from '@mui/icons-material/Comment';
import AssignmentIcon from '@mui/icons-material/Assignment';
import InputAdornment from '@mui/material/InputAdornment';
import toast from 'react-hot-toast';
import { projectsApi, ProjectStatus, type ProjectModel, type PaginatedProjectsResponse } from '../api/projectsApi';
import type { Department } from '../api/departmentsApi';
import { DepartmentAutocomplete } from '../components/common/DepartmentAutocomplete';
import { ProjectFormDialog } from '../components/projects/ProjectFormDialog';
import { ProjectStatusDialog } from '../components/projects/ProjectStatusDialog';
import { DeleteProjectDialog } from '../components/projects/DeleteProjectDialog';
import { ProjectDetailsDialog } from '../components/projects/ProjectDetailsDialog';
import { format } from 'date-fns';
import { SecureImage } from '../components/common/SecureImage';
import { useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Checkbox } from '@mui/material';
import { BulkActionsBar } from '../components/common/BulkActionsBar';
import { BulkConfirmDialog, type BulkActionType } from '../components/common/BulkConfirmDialog';

export const Projects = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<PaginatedProjectsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState(0); 
  const [page, setPage] = useState(1);
  const [filterDepartment, setFilterDepartment] = useState<Department | null>(null);
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  
  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editProject, setEditProject] = useState<ProjectModel | null>(null);
  const [deleteProjectItem, setDeleteProjectItem] = useState<ProjectModel | null>(null);
  const [statusDialogData, setStatusDialogData] = useState<{ project: ProjectModel, action: 'publish' | 'archive' | 'unarchive' } | null>(null);
  const [detailsProjectId, setDetailsProjectId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkAction, setBulkAction] = useState<BulkActionType | null>(null);
  
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked && data) {
      const itemsToSelect = activeTab === 0 ? data.data.filter(item => item.status !== 'ARCHIVED') : data.data;
      setSelectedItems(itemsToSelect.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectOne = (id: string, e: React.MouseEvent | React.ChangeEvent) => {
    e.stopPropagation();
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkAction = (action: BulkActionType) => {
    if (!selectedItems.length) return;
    setBulkAction(action);
  };

  const executeBulkAction = async () => {
    if (!selectedItems.length || !bulkAction) return;

    setBulkProcessing(true);
    try {
      await Promise.all(selectedItems.map(id => {
        if (bulkAction === 'delete') return projectsApi.deleteProject(id);
        if (bulkAction === 'publish') return projectsApi.publishProject(id);
        if (bulkAction === 'archive') return projectsApi.archiveProject(id);
        if (bulkAction === 'unarchive') return projectsApi.unarchiveProject(id);
      }));
      setSelectedItems([]);
      fetchData();
    } catch (error) {
      console.error('Bulk action error', error);
    } finally {
      setBulkProcessing(false);
      setBulkAction(null);
    }
  };

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
      const targetStatus = activeTab === 1 ? ProjectStatus.ARCHIVED : (filterStatus || undefined);
      const res = await projectsApi.getProjects(page, 10, filterDepartment?.id || undefined, targetStatus, debouncedSearch);
      setData(res);
    } catch (error) {
      console.error('Failed to fetch projects', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, filterDepartment, filterStatus, activeTab, debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId) {
      projectsApi.getProjectById(editId)
        .then((item) => {
          setEditProject(item);
          setIsFormOpen(true);
          setSearchParams({}, { replace: true });
        })
        .catch((error) => console.error('Failed to fetch project for editing', error));
    }
  }, [searchParams, setSearchParams]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setFilterStatus('');
    setPage(1);
  };

  const getStatusChip = (status: ProjectStatus) => {
    switch(status) {
      case ProjectStatus.PUBLISHED: return <Chip label="Опубліковано" color="success" size="small" />;
      case ProjectStatus.ARCHIVED: return <Chip label="В архіві" color="warning" size="small" />;
      case ProjectStatus.DRAFT: return <Chip label="Чернетка" color="default" size="small" />;
    }
  };

  const handleViewPdf = async (project: ProjectModel, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setDownloadingId(project.id);
      const blob = await projectsApi.downloadProjectFile(project.fileUrl);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (error) {
      console.error('Failed to view document', error);
      toast.error('Не вдалося відкрити PDF документ.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSingleClick = (item: ProjectModel) => {
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    clickTimeoutRef.current = setTimeout(() => {
      setDetailsProjectId(item.id);
      clickTimeoutRef.current = null;
    }, 250);
  };

  const handleDoubleClick = (item: ProjectModel) => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    if (activeTab === 0) {
      setEditProject(item);
      setIsFormOpen(true);
    } else {
      setDetailsProjectId(item.id);
    }
  };

  const projectsList = data?.data?.filter(item => activeTab === 0 ? item.status !== ProjectStatus.ARCHIVED : true) || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Ініціативи та Проєкти</Typography>
        <Button 
          variant="contained" 
          startIcon={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AddIcon fontSize="small" />
              <AssignmentIcon fontSize="small" />
            </Box>
          } 
          onClick={() => { setEditProject(null); setIsFormOpen(true); }}
        >
          Створити проєкт
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
              <TextField select size="small" label="Статус" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value as ProjectStatus | ''); setPage(1); }} sx={{ minWidth: 160 }}>
                <MenuItem value="">Всі активні</MenuItem>
                <MenuItem value={ProjectStatus.PUBLISHED}>Опубліковані</MenuItem>
                <MenuItem value={ProjectStatus.DRAFT}>Чернетки</MenuItem>
              </TextField>
            )}
          </Box>
          <ToggleButtonGroup value={viewMode} exclusive onChange={(_, newMode) => { if (newMode) setViewMode(newMode); }} size="small">
            <ToggleButton value="grid"><GridViewIcon /></ToggleButton>
            <ToggleButton value="table"><ViewListIcon /></ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {loading ? (
          viewMode === 'table' ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        indeterminate={selectedItems.length > 0 && selectedItems.length < (projectsList.length || 0)}
                        checked={projectsList.length > 0 && selectedItems.length === projectsList.length}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Назва проєкту</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Охоплення</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Статус</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Автор</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Створено</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Статистика</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Дії</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell padding="checkbox"><Skeleton variant="circular" width={24} height={24} /></TableCell>
                      <TableCell><Skeleton variant="text" width={240} /></TableCell>
                      <TableCell><Skeleton variant="text" width={140} /></TableCell>
                      <TableCell><Skeleton variant="rounded" width={90} height={24} sx={{ borderRadius: 4 }} /></TableCell>
                      <TableCell><Skeleton variant="text" width={120} /></TableCell>
                      <TableCell><Skeleton variant="text" width={80} /></TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                          <Skeleton variant="circular" width={20} height={20} />
                          <Skeleton variant="circular" width={20} height={20} />
                          <Skeleton variant="circular" width={20} height={20} />
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <Skeleton variant="circular" width={32} height={32} />
                          <Skeleton variant="circular" width={32} height={32} />
                          <Skeleton variant="circular" width={32} height={32} />
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 2 }}>
              {Array.from({ length: 6 }).map((_, idx) => (
                <Card key={idx} sx={{ display: 'flex', flexDirection: 'column', height: 280 }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', mb: 1.5 }}>
                      <Skeleton variant="rounded" width={40} height={40} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Skeleton variant="text" width="90%" height={28} sx={{ mb: 0.5 }} />
                        <Skeleton variant="rounded" width={90} height={24} sx={{ borderRadius: 4 }} />
                      </Box>
                    </Box>
                    <Skeleton variant="text" width="100%" />
                    <Skeleton variant="text" width="100%" />
                    <Skeleton variant="text" width="60%" sx={{ mb: 1.5 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 'auto', mb: 1.5 }}>
                      <Skeleton variant="text" width="50%" />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Skeleton variant="circular" width={20} height={20} />
                        <Skeleton variant="text" width="40%" />
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', pt: 1.5, borderTop: '1px dashed', borderColor: 'divider' }}>
                      <Skeleton variant="text" width={30} />
                      <Skeleton variant="text" width={30} />
                      <Skeleton variant="text" width={30} />
                    </Box>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'space-between', borderTop: 1, borderColor: 'divider', px: 2 }}>
                    <Skeleton variant="text" width={100} height={32} />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Skeleton variant="circular" width={28} height={28} />
                      <Skeleton variant="circular" width={28} height={28} />
                      <Skeleton variant="circular" width={28} height={28} />
                    </Box>
                  </CardActions>
                </Card>
              ))}
            </Box>
          )
        ) : viewMode === 'table' ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Назва проєкту</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Охоплення</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Статус</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Автор</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Створено</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Статистика</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Дії</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projectsList.map((item) => (
                  <TableRow 
                    key={item.id} 
                    hover 
                    onClick={() => handleSingleClick(item)}
                    onDoubleClick={() => handleDoubleClick(item)}
                    selected={selectedItems.includes(item.id)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        checked={selectedItems.includes(item.id)}
                        onChange={(e) => handleSelectOne(item.id, e)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 250, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</TableCell>
                    <TableCell>{item.departments?.length ? item.departments.map(d => d.name).join(', ') : 'Всі підрозділи'}</TableCell>
                    <TableCell>{getStatusChip(item.status)}</TableCell>
                    <TableCell>{`${item.author.firstName} ${item.author.lastName}`}</TableCell>
                    <TableCell>{format(new Date(item.createdAt), 'dd.MM.yyyy')}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'success.main' }}>
                          <ThumbUpIcon sx={{ fontSize: 16 }} />
                          <Typography variant="body2">{item.upvotes || 0}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'error.main' }}>
                          <ThumbDownIcon sx={{ fontSize: 16 }} />
                          <Typography variant="body2">{item.downvotes || 0}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'info.main' }}>
                          <CommentIcon sx={{ fontSize: 16 }} />
                          <Typography variant="body2">{item._count?.comments || 0}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Переглянути PDF">
                        <IconButton color="info" onClick={(e) => handleViewPdf(item, e)} disabled={downloadingId === item.id}>
                          {downloadingId === item.id ? <CircularProgress size={24} /> : <VisibilityIcon />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Переглянути коментарі">
                        <IconButton color="primary" onClick={() => setDetailsProjectId(item.id)}>
                          <CommentIcon />
                        </IconButton>
                      </Tooltip>
                      {item.status === ProjectStatus.DRAFT && (
                        <>
                          <Tooltip title="Опублікувати"><IconButton color="success" onClick={() => setStatusDialogData({ project: item, action: 'publish' })}><PublicIcon /></IconButton></Tooltip>
                          <Tooltip title="Редагувати"><IconButton color="primary" onClick={() => { setEditProject(item); setIsFormOpen(true); }}><EditIcon /></IconButton></Tooltip>
                          <Tooltip title="В архів"><IconButton color="warning" onClick={() => setStatusDialogData({ project: item, action: 'archive' })}><ArchiveIcon /></IconButton></Tooltip>
                        </>
                      )}
                      {item.status === ProjectStatus.PUBLISHED && (
                        <Tooltip title="В архів"><IconButton color="warning" onClick={() => setStatusDialogData({ project: item, action: 'archive' })}><ArchiveIcon /></IconButton></Tooltip>
                      )}
                      {item.status === ProjectStatus.ARCHIVED && (
                        <>
                          <Tooltip title="Відновити в чернетки"><IconButton color="success" onClick={() => setStatusDialogData({ project: item, action: 'unarchive' })}><UnarchiveIcon /></IconButton></Tooltip>
                          <Tooltip title="Видалити"><IconButton color="error" onClick={() => setDeleteProjectItem(item)}><DeleteIcon /></IconButton></Tooltip>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {projectsList.length === 0 && <TableRow><TableCell colSpan={7} align="center">Проєктів не знайдено</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 2 }}>
            {projectsList.map((item) => (
              <Card 
                key={item.id} 
                onClick={() => handleSingleClick(item)}
                onDoubleClick={() => handleDoubleClick(item)}
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  position: 'relative',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease', 
                  border: selectedItems.includes(item.id) ? 2 : 0,
                  borderColor: 'primary.main',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 6, cursor: 'pointer' } 
                }}
              >
                <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
                  <Checkbox
                    size="small"
                    checked={selectedItems.includes(item.id)}
                    onChange={(e) => handleSelectOne(item.id, e)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Box>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', mb: 1.5 }}>
                    <Box sx={{ p: 1, bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: 1, display: 'flex' }}>
                      <AssignmentIcon />
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontSize: '1.05rem', lineHeight: 1.2, mb: 0.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {item.title}
                      </Typography>
                      {getStatusChip(item.status)}
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.description}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 'auto', mb: 1.5 }}>
                    <Typography variant="caption" component="div" color="text.secondary">
                      Охоплення: {item.departments?.length ? item.departments.map(d => d.name).join(', ') : 'Для всіх підрозділів'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 20, height: 20 }}>
                        {item.author.avatarUrl ? <SecureImage src={item.author.avatarUrl} alt="A" /> : item.author.firstName.charAt(0)}
                      </Avatar>
                      <Typography variant="caption" color="text.secondary">
                        {item.author.firstName} {item.author.lastName}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', pt: 1.5, borderTop: '1px dashed', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'success.main' }}>
                      <ThumbUpIcon sx={{ fontSize: 16 }} />
                      <Typography variant="caption">{item.upvotes || 0}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'error.main' }}>
                      <ThumbDownIcon sx={{ fontSize: 16 }} />
                      <Typography variant="caption">{item.downvotes || 0}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'info.main' }}>
                      <CommentIcon sx={{ fontSize: 16 }} />
                      <Typography variant="caption">{item._count?.comments || 0}</Typography>
                    </Box>
                  </Box>
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'space-between', borderTop: 1, borderColor: 'divider', px: 2 }} onClick={(e) => e.stopPropagation()}>
                  <Button 
                    size="small" 
                    startIcon={downloadingId === item.id ? <CircularProgress size={14} /> : <VisibilityIcon />} 
                    onClick={(e) => handleViewPdf(item, e)}
                    disabled={downloadingId === item.id}
                  >
                    Переглянути
                  </Button>
                  <Box>
                    <Tooltip title="Переглянути коментарі">
                      <IconButton size="small" color="info" onClick={() => setDetailsProjectId(item.id)}>
                        <CommentIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {item.status === ProjectStatus.DRAFT && (
                    <>
                      <Tooltip title="Опублікувати"><IconButton size="small" color="success" onClick={() => setStatusDialogData({ project: item, action: 'publish' })}><PublicIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Редагувати"><IconButton size="small" color="primary" onClick={() => { setEditProject(item); setIsFormOpen(true); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="В архів"><IconButton size="small" color="warning" onClick={() => setStatusDialogData({ project: item, action: 'archive' })}><ArchiveIcon fontSize="small" /></IconButton></Tooltip>
                    </>
                  )}
                  {item.status === ProjectStatus.PUBLISHED && (
                    <Tooltip title="В архів"><IconButton size="small" color="warning" onClick={() => setStatusDialogData({ project: item, action: 'archive' })}><ArchiveIcon fontSize="small" /></IconButton></Tooltip>
                  )}
                  {item.status === ProjectStatus.ARCHIVED && (
                    <>
                      <Tooltip title="Відновити в чернетки"><IconButton size="small" color="success" onClick={() => setStatusDialogData({ project: item, action: 'unarchive' })}><UnarchiveIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Видалити"><IconButton size="small" color="error" onClick={() => setDeleteProjectItem(item)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                    </>
                  )}
                  </Box>
                </CardActions>
              </Card>
            ))}
            {projectsList.length === 0 && <Typography sx={{ gridColumn: '1 / -1', textAlign: 'center', py: 4 }}>Проєктів не знайдено</Typography>}
          </Box>
        )}
        
        {data && (data.meta?.lastPage || 0) > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2, pt: 3 }}>
            <Pagination count={data.meta.lastPage} page={page} onChange={(_, val) => setPage(val)} color="primary" />
          </Box>
        )}
      </Paper>

      <ProjectFormDialog open={isFormOpen} project={editProject} onClose={() => setIsFormOpen(false)} onSuccess={fetchData} />
      <DeleteProjectDialog open={!!deleteProjectItem} project={deleteProjectItem} onClose={() => setDeleteProjectItem(null)} onSuccess={fetchData} />
      <ProjectStatusDialog 
        open={!!statusDialogData} 
        project={statusDialogData?.project || null} 
        action={statusDialogData?.action || null} 
        onClose={() => setStatusDialogData(null)} 
        onSuccess={fetchData} 
      />
      <ProjectDetailsDialog
        open={!!detailsProjectId}
        projectId={detailsProjectId}
        onClose={() => setDetailsProjectId(null)}
        onRefreshList={fetchData}
      />

      <BulkActionsBar
        selectedCount={selectedItems.length}
        onClear={() => setSelectedItems([])}
        onPublish={activeTab === 0 ? () => handleBulkAction('publish') : undefined}
        onArchive={activeTab === 0 ? () => handleBulkAction('archive') : undefined}
        onUnarchive={activeTab === 1 ? () => handleBulkAction('unarchive') : undefined}
        onDelete={activeTab === 1 ? () => handleBulkAction('delete') : undefined}
        isProcessing={bulkProcessing}
      />

      <BulkConfirmDialog
        open={!!bulkAction}
        action={bulkAction}
        count={selectedItems.length}
        onClose={() => setBulkAction(null)}
        onConfirm={executeBulkAction}
        isProcessing={bulkProcessing}
      />
    </Box>
  );
};