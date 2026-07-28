import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Pagination, CircularProgress,
  IconButton, Tooltip, Chip, MenuItem, TextField,
  ToggleButton, ToggleButtonGroup, Card, CardContent, CardActions, Tabs, Tab
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ViewListIcon from '@mui/icons-material/ViewList';
import GridViewIcon from '@mui/icons-material/GridView';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import PublicIcon from '@mui/icons-material/Public';
import DraftsIcon from '@mui/icons-material/Drafts';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import ContentCopyIcon from '@mui/icons-material/ContentCopy'; // Імпортуємо іконку для копіювання
import { pollsApi, PollStatus, type Poll, type PaginatedPollsResponse } from '../api/pollsApi';
import { departmentsApi, type Department } from '../api/departmentsApi';
import { PollFormDialog } from '../components/polls/PollFormDialog';
import { DeletePollDialog } from '../components/polls/DeletePollDialog';
import { PollStatusDialog } from '../components/polls/PollStatusDialog';
import { PollDetailsDialog } from '../components/polls/PollDetailsDialog';
import { format } from 'date-fns';

export const Polls = () => {
  const [data, setData] = useState<PaginatedPollsResponse | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState(0); 
  const [page, setPage] = useState(1);
  const [filterDepartment, setFilterDepartment] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<PollStatus | ''>('');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editPoll, setEditPoll] = useState<Poll | null>(null);
  const [deletePollItem, setDeletePollItem] = useState<Poll | null>(null);
  
  const [statusDialogItem, setStatusDialogItem] = useState<{ poll: Poll, targetStatus: PollStatus } | null>(null);
  const [viewPollDetails, setViewPollDetails] = useState<Poll | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false); // Стан для відслідковування режиму форми

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const targetStatus = activeTab === 1 ? PollStatus.ARCHIVED : (filterStatus || undefined);
      
      const res = await pollsApi.getPolls(page, 10, filterDepartment || undefined, targetStatus, sortBy, sortOrder);
      setData(res);
    } catch (error) {
      console.error('Failed to fetch polls data', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, filterDepartment, filterStatus, sortBy, sortOrder, activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Завантажуємо підрозділи лише один раз при монтуванні, щоб не блокувати таблицю
  useEffect(() => {
    departmentsApi.getDepartments()
      .then(setDepartments)
      .catch(() => setDepartments([]));
  }, []);

  // Безпечний масив опитувань, навіть якщо бекенд повернув помилкову структуру
  const pollsList: Poll[] = Array.isArray(data?.data) ? data.data : [];

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setFilterStatus('');
    setPage(1);
  };

  const getStatusChip = (status: PollStatus) => {
    switch(status) {
      case PollStatus.PUBLISHED: return <Chip label="Опубліковано" color="success" size="small" />;
      case PollStatus.ARCHIVED: return <Chip label="В архіві" color="warning" size="small" />;
      case PollStatus.DRAFT: return <Chip label="Чернетка" color="default" size="small" />;
    }
  };

  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSingleClick = (item: Poll) => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    clickTimeoutRef.current = setTimeout(() => {
      setViewPollDetails(item);
      clickTimeoutRef.current = null;
    }, 250);
  };

  const handleDoubleClick = (item: Poll) => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    if (item.status === PollStatus.DRAFT) {
      setEditPoll(item);
      setIsFormOpen(true);
    } else {
      setViewPollDetails(item);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Управління опитуваннями</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditPoll(null); setIsDuplicate(false); setIsFormOpen(true); }}>
          Створити опитування
        </Button>
      </Box>

      <Paper sx={{ width: '100%', mb: 2, p: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tab label="Активні / Чернетки" />
          <Tab label="Архів" />
        </Tabs>

        <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField select size="small" label="Підрозділ" value={filterDepartment} onChange={(e) => { setFilterDepartment(e.target.value); setPage(1); }} sx={{ minWidth: 160 }}>
              <MenuItem value="">Всі (Загальнонаціональні)</MenuItem>
              {departments.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
            </TextField>
            
            {activeTab === 0 && (
              <TextField select size="small" label="Статус" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value as PollStatus | ''); setPage(1); }} sx={{ minWidth: 160 }}>
                <MenuItem value="">Всі активні</MenuItem>
                <MenuItem value={PollStatus.PUBLISHED}>Опубліковані</MenuItem>
                <MenuItem value={PollStatus.DRAFT}>Чернетки</MenuItem>
              </TextField>
            )}

            <TextField select size="small" label="Сортувати за" value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }} sx={{ minWidth: 160 }}>
              <MenuItem value="createdAt">Датою створення</MenuItem>
              <MenuItem value="votes">Кількістю голосів</MenuItem>
            </TextField>
            <TextField select size="small" label="Порядок" value={sortOrder} onChange={(e) => { setSortOrder(e.target.value as 'asc' | 'desc'); setPage(1); }} sx={{ minWidth: 160 }}>
              <MenuItem value="desc">За спаданням</MenuItem>
              <MenuItem value="asc">За зростанням</MenuItem>
            </TextField>
          </Box>
          <ToggleButtonGroup value={viewMode} exclusive onChange={(_, newMode) => { if (newMode) setViewMode(newMode); }} size="small">
            <ToggleButton value="grid"><GridViewIcon /></ToggleButton>
            <ToggleButton value="table"><ViewListIcon /></ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
        ) : viewMode === 'table' ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Заголовок</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Охоплення</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Статус</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Голосів</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Створено</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Дії</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pollsList.map((item) => (
                  <TableRow 
                    key={item.id} 
                    hover 
                    onClick={() => handleSingleClick(item)}
                    onDoubleClick={() => handleDoubleClick(item)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell sx={{ maxWidth: 250 }}>{item.title}</TableCell>
                    <TableCell>{item.departments?.length ? item.departments.map(d => d.name).join(', ') : 'Всі підрозділи'}</TableCell>
                    <TableCell>{getStatusChip(item.status)}</TableCell>
                    <TableCell>{item.totalVotes || 0}</TableCell>
                    <TableCell>{item.createdAt ? format(new Date(item.createdAt), 'dd.MM.yyyy') : '—'}</TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Дублювати як чернетку">
                        <IconButton color="info" onClick={() => { setEditPoll(item); setIsDuplicate(true); setIsFormOpen(true); }}>
                          <ContentCopyIcon />
                        </IconButton>
                      </Tooltip>
                      {item.status === PollStatus.DRAFT && (
                        <>
                          <Tooltip title="Опублікувати"><IconButton color="success" onClick={() => setStatusDialogItem({ poll: item, targetStatus: PollStatus.PUBLISHED })}><PublicIcon /></IconButton></Tooltip>
                          <Tooltip title="Редагувати"><IconButton color="primary" onClick={() => { setEditPoll(item); setIsDuplicate(false); setIsFormOpen(true); }}><EditIcon /></IconButton></Tooltip>
                        </>
                      )}
                      {item.status === PollStatus.PUBLISHED && (
                        <>
                          <Tooltip title="Повернути в чернетки"><IconButton color="default" onClick={() => setStatusDialogItem({ poll: item, targetStatus: PollStatus.DRAFT })}><DraftsIcon /></IconButton></Tooltip>
                          <Tooltip title="В архів"><IconButton color="warning" onClick={() => setStatusDialogItem({ poll: item, targetStatus: PollStatus.ARCHIVED })}><ArchiveIcon /></IconButton></Tooltip>
                        </>
                      )}
                      {item.status === PollStatus.ARCHIVED && (
                        <Tooltip title="Відновити в чернетки"><IconButton color="success" onClick={() => setStatusDialogItem({ poll: item, targetStatus: PollStatus.DRAFT })}><UnarchiveIcon /></IconButton></Tooltip>
                      )}
                      <Tooltip title="Видалити"><IconButton color="error" onClick={() => setDeletePollItem(item)}><DeleteIcon /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {pollsList.length === 0 && <TableRow><TableCell colSpan={6} align="center">Опитувань не знайдено</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 2 }}>
            {pollsList.map((item) => (
              <Card 
                key={item.id} 
                onClick={() => handleSingleClick(item)}
                onDoubleClick={() => handleDoubleClick(item)}
                sx={{
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                    cursor: 'pointer'
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" sx={{ fontSize: '1.1rem', mb: 1 }}>{item.title}</Typography>
                  <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>{getStatusChip(item.status)}</Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Охоплення: {item.departments?.length ? item.departments.map(d => d.name).join(', ') : 'Загальнонаціональне'}
                  </Typography>
                  {item.expiresAt && (
                    <Typography 
                      variant="body2" 
                      color={new Date(item.expiresAt) < new Date() ? 'error.main' : 'info.main'} 
                      sx={{ mb: 1, fontWeight: 500 }}
                    >
                      {new Date(item.expiresAt) < new Date() ? 'Час вичерпано: ' : 'Активне до: '}
                      {format(new Date(item.expiresAt), 'dd.MM.yyyy HH:mm')}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', mb: 1 }}>
                    <HowToVoteIcon fontSize="small" /> <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Всього голосів: {item.totalVotes || 0}</Typography>
                  </Box>
                  <Box sx={{ mt: 2, pl: 2, borderLeft: '3px solid', borderColor: 'divider' }}>
                    {item.options?.slice(0, 3).map(opt => (
                      <Typography key={opt.id} variant="caption" sx={{ display: 'block' }} color="text.secondary">
                        • {opt.text} ({opt._count?.votes || 0})
                      </Typography>
                    ))}
                    {(item.options?.length || 0) > 3 && <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }} color="text.disabled">...та ще {(item.options?.length || 0) - 3}</Typography>}
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end', borderTop: 1, borderColor: 'divider' }} onClick={(e) => e.stopPropagation()}>
                  <Tooltip title="Дублювати як чернетку">
                    <IconButton size="small" color="info" onClick={() => { setEditPoll(item); setIsDuplicate(true); setIsFormOpen(true); }}>
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {item.status === PollStatus.DRAFT && (
                    <>
                      <Tooltip title="Опублікувати"><IconButton size="small" color="success" onClick={() => setStatusDialogItem({ poll: item, targetStatus: PollStatus.PUBLISHED })}><PublicIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Редагувати"><IconButton size="small" color="primary" onClick={() => { setEditPoll(item); setIsDuplicate(false); setIsFormOpen(true); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    </>
                  )}
                  {item.status === PollStatus.PUBLISHED && (
                    <>
                      <Tooltip title="Повернути в чернетки"><IconButton size="small" color="default" onClick={() => setStatusDialogItem({ poll: item, targetStatus: PollStatus.DRAFT })}><DraftsIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="В архів"><IconButton size="small" color="warning" onClick={() => setStatusDialogItem({ poll: item, targetStatus: PollStatus.ARCHIVED })}><ArchiveIcon fontSize="small" /></IconButton></Tooltip>
                    </>
                  )}
                  {item.status === PollStatus.ARCHIVED && (
                    <Tooltip title="Відновити в чернетки"><IconButton size="small" color="success" onClick={() => setStatusDialogItem({ poll: item, targetStatus: PollStatus.DRAFT })}><UnarchiveIcon fontSize="small" /></IconButton></Tooltip>
                  )}
                  <Tooltip title="Видалити"><IconButton size="small" color="error" onClick={() => setDeletePollItem(item)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                </CardActions>
              </Card>
            ))}
            {pollsList.length === 0 && <Typography sx={{ gridColumn: '1 / -1', textAlign: 'center', py: 4 }}>Опитувань не знайдено</Typography>}
          </Box>
        )}
        
        {data && (data.meta?.lastPage || 0) > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2, pt: 3 }}>
            <Pagination count={data.meta.lastPage} page={page} onChange={(_, val) => setPage(val)} color="primary" />
          </Box>
        )}
      </Paper>

      <PollFormDialog 
        open={isFormOpen} 
        poll={editPoll} 
        onClose={() => setIsFormOpen(false)} 
        onSuccess={fetchData} 
        isDuplicate={isDuplicate}
      />
      <DeletePollDialog open={!!deletePollItem} poll={deletePollItem} onClose={() => setDeletePollItem(null)} onSuccess={fetchData} />
      <PollStatusDialog 
        open={!!statusDialogItem} 
        poll={statusDialogItem?.poll || null} 
        targetStatus={statusDialogItem?.targetStatus || PollStatus.DRAFT} 
        onClose={() => setStatusDialogItem(null)} 
        onSuccess={fetchData} 
      />

      <PollDetailsDialog
        open={!!viewPollDetails}
        poll={viewPollDetails}
        onClose={() => setViewPollDetails(null)}
      />
    </Box>
  );
};