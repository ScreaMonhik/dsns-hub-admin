import { useEffect, useState, useCallback } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableHead, 
  TableRow, Button, Chip, CircularProgress, Alert, Tooltip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DevicesIcon from '@mui/icons-material/Devices';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import toast from 'react-hot-toast';
import { sessionsApi, type UserSession } from '../../api/sessionsApi';

export const ActiveSessionsTab = () => {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await sessionsApi.getMySessions();
      setSessions(data);
    } catch (error) {
      console.error('Failed to load sessions', error);
      toast.error('Не вдалося завантажити список сесій');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRevokeSession = async (sessionId: string) => {
    try {
      setRevoking(sessionId);
      await sessionsApi.revokeMySession(sessionId);
      toast.success('Сесію успішно завершено');
      fetchSessions();
    } catch (error) {
      console.error('Failed to revoke session', error);
      toast.error('Не вдалося завершити сесію');
    } finally {
      setRevoking(null);
    }
  };

  const handleRevokeAllOther = () => {
    setConfirmRevokeAll(true);
  };

  const executeRevokeAllOther = async () => {
    try {
      setRevokingAll(true);
      setConfirmRevokeAll(false);
      await sessionsApi.revokeAllOtherMySessions();
      toast.success('Усі інші сесії успішно завершено');
      fetchSessions();
    } catch (error) {
      console.error('Failed to revoke other sessions', error);
      toast.error('Не вдалося завершити сесії');
    } finally {
      setRevokingAll(false);
    }
  };

  const getDeviceIcon = (userAgent: string) => {
    const lower = userAgent.toLowerCase();
    if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone')) {
      return <PhoneIphoneIcon color="action" />;
    }
    return <DesktopWindowsIcon color="action" />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6">Активні сесії</Typography>
          <Typography variant="body2" color="text.secondary">
            Управління пристроями, з яких виконано вхід у ваш акаунт.
          </Typography>
        </Box>
        {sessions.length > 1 && (
          <Button
            variant="outlined"
            color="error"
            onClick={handleRevokeAllOther}
            disabled={revokingAll}
            startIcon={revokingAll ? <CircularProgress size={18} color="inherit" /> : <DeleteIcon />}
          >
            Завершити всі інші сесії
          </Button>
        )}
      </Box>

      {sessions.length === 0 ? (
        <Alert severity="info">Активних сесій не знайдено.</Alert>
      ) : (
        <Paper variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Пристрій / Браузер</TableCell>
                <TableCell>IP-адреса</TableCell>
                <TableCell>Остання активність</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell align="right">Дія</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {getDeviceIcon(session.userAgent)}
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {session.userAgent}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {session.ipAddress}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(session.lastActiveAt).toLocaleString('uk-UA')}
                  </TableCell>
                  <TableCell>
                    {session.isCurrent ? (
                      <Chip label="Поточна сесія" color="success" size="small" />
                    ) : (
                      <Chip label="Активна" variant="outlined" size="small" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {!session.isCurrent && (
                      <Tooltip title="Завершити сесію">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleRevokeSession(session.id)}
                          disabled={revoking === session.id}
                        >
                          {revoking === session.id ? <CircularProgress size={18} color="inherit" /> : <DeleteIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Dialog open={confirmRevokeAll} onClose={() => setConfirmRevokeAll(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Завершення сесій</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Ви впевнені, що хочете завершити <strong>всі інші</strong> активні сесії на усіх пристроях? Вам не доведеться входити знову на поточному пристрої.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRevokeAll(false)} disabled={revokingAll}>
            Скасувати
          </Button>
          <Button onClick={executeRevokeAllOther} variant="contained" color="error" disabled={revokingAll}>
            Завершити інші сесії
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};