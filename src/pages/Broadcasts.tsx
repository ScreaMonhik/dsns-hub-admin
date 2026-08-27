import { useEffect, useState, useCallback } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Pagination, CircularProgress,
  IconButton, Tooltip, Chip, MenuItem, TextField, Skeleton, InputAdornment
} from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { format } from 'date-fns';
import { broadcastsApi, type EmergencyBroadcast, type BroadcastSeverity, type PaginatedBroadcastsResponse } from '../api/broadcastsApi';
import { CreateBroadcastDialog } from '../components/broadcasts/CreateBroadcastDialog';
import { BroadcastDetailsDialog } from '../components/broadcasts/BroadcastDetailsDialog';

export const Broadcasts = () => {
  const [data, setData] = useState<PaginatedBroadcastsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [severityFilter, setSeverityFilter] = useState<BroadcastSeverity | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState<EmergencyBroadcast | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchBroadcasts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await broadcastsApi.getBroadcasts(page, 10, severityFilter, debouncedSearch);
      setData(res);
    } catch (error) {
      console.error('Failed to fetch broadcasts', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, severityFilter, debouncedSearch]);

  useEffect(() => {
    fetchBroadcasts();
  }, [fetchBroadcasts]);

  const getSeverityChip = (severity: BroadcastSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return <Chip label="КРИТИЧНИЙ" color="error" size="small" sx={{ fontWeight: 'bold' }} />;
      case 'WARNING':
        return <Chip label="УВАГА" color="warning" size="small" sx={{ fontWeight: 'bold' }} />;
      case 'INFO':
        return <Chip label="ІНФОРМАЦІЙНИЙ" color="info" size="small" />;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CampaignIcon color="error" sx={{ fontSize: 36 }} />
          <Typography variant="h4">Система екстрених розсилок</Typography>
        </Box>
        <Button 
          variant="contained" 
          color="error" 
          startIcon={<CampaignIcon />}
          onClick={() => setIsCreateOpen(true)}
          sx={{ fontWeight: 'bold' }}
        >
          Створити екстрену розсилку
        </Button>
      </Box>

      <Paper sx={{ width: '100%', mb: 2, p: 2 }}>
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Пошук за заголовком або текстом..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
              }
            }}
            sx={{ minWidth: 240 }}
          />

          <TextField 
            select 
            size="small" 
            label="Рівень загрози" 
            value={severityFilter} 
            onChange={(e) => { setSeverityFilter(e.target.value as BroadcastSeverity | ''); setPage(1); }} 
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">Усі рівні</MenuItem>
            <MenuItem value="INFO">Інформаційний</MenuItem>
            <MenuItem value="WARNING">Увага</MenuItem>
            <MenuItem value="CRITICAL">Критичний</MenuItem>
          </TextField>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Заголовок та зміст</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Рівень загрози</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Звуковий сигнал</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Охоплення</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Час відправки</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Дії</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell><Skeleton variant="text" width={220} /></TableCell>
                    <TableCell><Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: 4 }} /></TableCell>
                    <TableCell><Skeleton variant="text" width={100} /></TableCell>
                    <TableCell><Skeleton variant="text" width={80} /></TableCell>
                    <TableCell><Skeleton variant="text" width={120} /></TableCell>
                    <TableCell align="right"><Skeleton variant="circular" width={32} height={32} sx={{ ml: 'auto' }} /></TableCell>
                  </TableRow>
                ))
              ) : data?.data.map((item) => (
                <TableRow 
                  key={item.id} 
                  hover 
                  onClick={() => setSelectedBroadcast(item)} 
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell sx={{ maxWidth: 320 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {item.body}
                    </Typography>
                  </TableCell>
                  <TableCell>{getSeverityChip(item.severity)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <VolumeUpIcon fontSize="small" color="action" />
                      <Typography variant="body2">{item.soundPreset}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {item.recipientCount} пристроїв
                    </Typography>
                  </TableCell>
                  <TableCell>{format(new Date(item.createdAt), 'dd.MM.yyyy HH:mm:ss')}</TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="Переглянути звіт">
                      <IconButton color="primary" onClick={() => setSelectedBroadcast(item)}>
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && data?.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    Екстрених розсилок ще не відправлялося
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {data && data.meta.lastPage > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2, pt: 3 }}>
            <Pagination 
              count={data.meta.lastPage} 
              page={page} 
              onChange={(_, value) => setPage(value)} 
              color="primary" 
            />
          </Box>
        )}
      </Paper>

      <CreateBroadcastDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchBroadcasts}
      />

      <BroadcastDetailsDialog
        open={!!selectedBroadcast}
        broadcast={selectedBroadcast}
        onClose={() => setSelectedBroadcast(null)}
      />
    </Box>
  );
};