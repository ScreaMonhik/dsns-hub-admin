import { useEffect, useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, 
  List, ListItem, ListItemAvatar, ListItemText, Avatar, IconButton, 
  Box, Typography, CircularProgress, Select, MenuItem, FormControl, InputLabel, Tooltip, Switch, Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { chatsApi, type GroupMember } from '../../api/chatsApi';
import { usersApi } from '../../api/usersApi';
import type { User } from '../../store/authStore';

interface Props {
  open: boolean;
  groupId: string;
  chatName: string;
  onClose: () => void;
}

export const ManageMembersDialog = ({ open, groupId, chatName, onClose }: Props) => {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchData();
    } else {
      setSelectedUserId('');
      setApiError(null);
    }
  }, [open, groupId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      setApiError(null);
      const [membersData, usersData] = await Promise.all([
        chatsApi.getMembers(groupId),
        usersApi.getUsers(1, 100) // Завантажуємо перші 100 користувачів для вибору
      ]);
      setMembers(membersData);
      setAllUsers(usersData.data);
    } catch (error: any) {
      setApiError(error.response?.data?.message || 'Помилка завантаження даних');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUserId) return;
    setAddingUser(true);
    try {
      setApiError(null);
      const newMember = await chatsApi.addMember(groupId, selectedUserId);
      
      // Якщо бекенд не повертає вкладений об'єкт user при створенні, беремо його з нашого списку
      const userObj = allUsers.find(u => u.id === selectedUserId);
      const memberWithUser = { ...newMember, user: newMember.user || userObj! };
      
      setMembers(prev => [...prev, memberWithUser]);
      setSelectedUserId('');
    } catch (error: any) {
      setApiError(error.response?.data?.message || 'Не вдалося додати користувача');
    } finally {
      setAddingUser(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      setApiError(null);
      await chatsApi.removeMember(groupId, userId);
      setMembers(prev => prev.filter(m => m.userId !== userId));
    } catch (error: any) {
      setApiError(error.response?.data?.message || 'Не вдалося видалити користувача');
    }
  };

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    try {
      setApiError(null);
      const updatedMember = await chatsApi.updateMemberRole(groupId, userId, !currentStatus);
      setMembers(prev => prev.map(m => m.userId === userId ? updatedMember : m));
    } catch (error: any) {
      setApiError(error.response?.data?.message || 'Не вдалося змінити роль');
    }
  };

  // Відфільтровуємо тих користувачів, які вже є в чаті
  const availableUsers = allUsers.filter(u => !members.some(m => m.userId === u.id));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
      <DialogTitle>Учасники чату: {chatName}</DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {apiError && <Alert severity="error">{apiError}</Alert>}

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControl fullWidth size="small">
            <InputLabel>Додати користувача</InputLabel>
            <Select
              value={selectedUserId}
              label="Додати користувача"
              onChange={(e) => setSelectedUserId(e.target.value)}
              disabled={loading || addingUser}
            >
              <MenuItem value=""><em>Оберіть співробітника...</em></MenuItem>
              {availableUsers.map(u => (
                <MenuItem key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} ({u.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button 
            variant="contained" 
            onClick={handleAddMember} 
            disabled={!selectedUserId || addingUser}
          >
            {addingUser ? 'Додавання...' : 'Додати'}
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
            {members.map((member) => (
              <ListItem
                key={member.id}
                sx={{ borderBottom: 1, borderColor: 'divider' }}
                secondaryAction={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Tooltip title={member.isAdmin ? 'Забрати права адміна чату' : 'Зробити адміном чату'}>
                      <Switch
                        size="small"
                        checked={member.isAdmin}
                        onChange={() => handleToggleAdmin(member.userId, member.isAdmin)}
                      />
                    </Tooltip>
                    <Tooltip title="Видалити з чату">
                      <IconButton edge="end" color="error" size="small" onClick={() => handleRemoveMember(member.userId)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: member.isAdmin ? 'primary.main' : 'grey.400' }}>
                    {member.user?.firstName?.charAt(0) || '?'}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`${member.user?.firstName || 'Невідомий'} ${member.user?.lastName || 'Користувач'}`}
                  secondary={
                    <Typography component="span" variant="body2" color={member.isAdmin ? 'primary.main' : 'text.secondary'}>
                      {member.isAdmin ? 'Адміністратор чату' : 'Учасник'}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
            {members.length === 0 && (
              <Typography sx={{ textAlign: 'center', py: 2, color: 'text.secondary' }}>
                В чаті немає учасників
              </Typography>
            )}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">Закрити</Button>
      </DialogActions>
    </Dialog>
  );
};