import { useEffect, useState, useCallback } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, 
  Table, TableBody, TableCell, TableHead, TableRow, Typography, 
  CircularProgress, Box, Alert, IconButton, Tooltip 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import toast from 'react-hot-toast';
import { sessionsApi, type UserSession } from '../../api/sessionsApi';
import type { User } from '../../store/authStore';
import { useAuthStore } from '../../store/authStore';

interface Props {
  open: boolean;
  user: User | null;
  onClose: () => void;
}

export const UserSessionsDialog = ({ open, user, onClose }: Props) => {
  const { user: currentUser, logout } = useAuthStore();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false);

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await sessionsApi.getUserSessions(user.id);
      setSessions(data);
    } catch (error) {
      console.error('Failed to load user sessions', error);
      toast.error('Не вдалося завантажити сесії користувача');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (open && user) {
      fetchSessions();
    }
  }, [open, user, fetchSessions]);

  const handleRevokeOne = async (sessionId: string) => {
    if (!user) return;
    try {
      setRevokingId(sessionId);
      await sessionsApi.revokeUserSession(user.id, sessionId);
      toast.success('Сесію примусово завершено');
      
      const revokedSession = sessions.find(s => s.id === sessionId);
      if (user.id === currentUser?.id && revokedSession?.isCurrent) {
        logout();
      } else {
        fetchSessions();
      }
    } catch (error) {
      console.error('Failed to revoke session', error);
      toast.error('Не вдалося завершити сесію');
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAll = () => {
    if (!user) return;
    setConfirmRevokeAll(true);
  };

  const executeRevokeAll = async () => {
    if (!user) return;
    try {
      setRevokingAll(true);
      setConfirmRevokeAll(false);
      await sessionsApi.revokeAllUserSessions(user.id);
      toast.success('Усі сесії користувача примусово скинуто');
      
      if (user.id === currentUser?.id) {
        logout();
      } else {
        fetchSessions();
      }
    } catch (error) {
      console.error('Failed to revoke all user sessions', error);
      toast.error('Не вдалося скинути сесії');
    } finally {
      setRevokingAll(false);
    }
  };

  const getDeviceIcon = (userAgent: string) => {
    const lower = userAgent.toLowerCase();
    if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone')) {
      return <PhoneIphoneIcon color="action" fontSize="small" />;
    }
    return <DesktopWindowsIcon color="action" fontSize="small" />;
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Сесії користувача: {user?.firstName} {user?.lastName} ({user?.email})
        </Typography>
        {sessions.length > 0 && (
          <Button
            size="small"
            variant="contained"
            color="error"
            onClick={handleRevokeAll}
            disabled={revokingAll}
            startIcon={revokingAll ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
          >
            Примусово розлогінити всюди
          </Button>
        )}
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : sessions.length === 0 ? (
          <Alert severity="info">У цього користувача немає активних сесій.</Alert>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Пристрій / User-Agent</TableCell>
                <TableCell>IP-адреса</TableCell>
                <TableCell>Остання активність</TableCell>
                <TableCell align="right">Дія</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getDeviceIcon(session.userAgent)}
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {session.userAgent}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{session.ipAddress}</TableCell>
                  <TableCell>{new Date(session.lastActiveAt).toLocaleString('uk-UA')}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Скинути сесію">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRevokeOne(session.id)}
                        disabled={revokingId === session.id}
                      >
                        {revokingId === session.id ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
      <DialogActions>
          <Button onClick={onClose}>Закрити</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmRevokeAll} onClose={() => setConfirmRevokeAll(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Підтвердження дії</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Ви впевнені, що хочете примусово розлогінити користувача <strong>{user?.email}</strong> з УСІХ пристроїв?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRevokeAll(false)} disabled={revokingAll}>
            Скасувати
          </Button>
          <Button onClick={executeRevokeAll} variant="contained" color="error" disabled={revokingAll}>
            Розлогінити всюди
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};