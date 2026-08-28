import { useEffect, useState, useCallback } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Pagination, CircularProgress,
  TextField, MenuItem, Chip, Skeleton, Button, Menu
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import toast from 'react-hot-toast';
import { auditApi, type PaginatedAuditLogsResponse } from '../api/auditApi';
import { format } from 'date-fns';
import { useCan } from '../hooks/useCan';
import { PermissionGuard } from '../components/common/PermissionGuard';

export const AuditLogs = () => {
  const { isSuperAdmin } = useCan();
  const [data, setData] = useState<PaginatedAuditLogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const [exporting, setExporting] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const result = await auditApi.getLogs(page, 15, actionFilter, resourceFilter);
      setData(result);
    } catch (error) {
      console.error('Failed to fetch audit logs', error);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, resourceFilter]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchLogs();
    }
  }, [fetchLogs, isSuperAdmin]);

  const handleExport = async (format: 'csv' | 'pdf') => {
    setExportAnchorEl(null);
    try {
      setExporting(true);
      await auditApi.exportLogs(format);
    } catch (error) {
      console.error('Export failed', error);
      toast.error('Помилка експорту.');
    } finally {
      setExporting(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'success';
      case 'UPDATE': return 'info';
      case 'DELETE': return 'error';
      case 'LOGIN': return 'primary';
      default: return 'default';
    }
  };

  return (
    <PermissionGuard require="SUPER_ADMIN" redirectTo="/">
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Журнал аудиту</Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={exporting ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
            onClick={(e) => setExportAnchorEl(e.currentTarget)}
            disabled={exporting}
          >
            Експорт логів
          </Button>
          <Menu
            anchorEl={exportAnchorEl}
            open={Boolean(exportAnchorEl)}
            onClose={() => setExportAnchorEl(null)}
          >
            <MenuItem onClick={() => handleExport('pdf')}>
              <PictureAsPdfIcon sx={{ mr: 1, color: 'error.main' }} fontSize="small" /> PDF
            </MenuItem>
            <MenuItem onClick={() => handleExport('csv')}>
              <TableChartIcon sx={{ mr: 1, color: 'success.main' }} fontSize="small" /> CSV
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      <Paper sx={{ width: '100%', mb: 2, p: 2 }}>
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField select size="small" label="Дія (Action)" value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }} sx={{ minWidth: 160 }}>
            <MenuItem value="">Всі дії</MenuItem>
            <MenuItem value="CREATE">Створення (CREATE)</MenuItem>
            <MenuItem value="UPDATE">Оновлення (UPDATE)</MenuItem>
            <MenuItem value="DELETE">Видалення (DELETE)</MenuItem>
            <MenuItem value="LOGIN">Вхід (LOGIN)</MenuItem>
          </TextField>

          <TextField select size="small" label="Ресурс" value={resourceFilter} onChange={(e) => { setResourceFilter(e.target.value); setPage(1); }} sx={{ minWidth: 160 }}>
            <MenuItem value="">Всі ресурси</MenuItem>
            <MenuItem value="USER">Користувачі</MenuItem>
            <MenuItem value="NEWS">Новини</MenuItem>
            <MenuItem value="PROJECT">Проєкти</MenuItem>
            <MenuItem value="DOCUMENT">Документи</MenuItem>
            <MenuItem value="POLL">Опитування</MenuItem>
            <MenuItem value="SYSTEM">Система</MenuItem>
          </TextField>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Час події</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Адміністратор</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Дія</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Ресурс</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Деталі / IP</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 10 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell><Skeleton variant="text" width={120} /></TableCell>
                    <TableCell><Skeleton variant="text" width={180} /></TableCell>
                    <TableCell><Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: 4 }} /></TableCell>
                    <TableCell><Skeleton variant="text" width={100} /></TableCell>
                    <TableCell><Skeleton variant="text" width={200} /></TableCell>
                  </TableRow>
                ))
              ) : data?.data.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell>{format(new Date(log.createdAt), 'dd.MM.yyyy HH:mm:ss')}</TableCell>
                  <TableCell>
                    {log.user ? (
                      <Typography variant="body2">
                        {log.user.firstName} {log.user.lastName} <br/>
                        <Typography component="span" variant="caption" color="text.secondary">{log.user.email}</Typography>
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">Система ({log.userId})</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip label={log.action} color={getActionColor(log.action) as any} size="small" />
                  </TableCell>
                  <TableCell>{log.resource}</TableCell>
                  <TableCell>
                    <Typography 
                      variant="caption" 
                      component="pre"
                      sx={{ display: 'block', wordBreak: 'break-word', whiteSpace: 'pre-wrap', m: 0, fontFamily: 'inherit' }}
                    >
                      {log.details 
                        ? (typeof log.details === 'object' ? JSON.stringify(log.details, null, 2) : log.details) 
                        : '—'}
                    </Typography>
                    {log.ipAddress && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        IP: {log.ipAddress}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!loading && data?.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>Логів не знайдено</TableCell>
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
      </Box>
    </PermissionGuard>
  );
};