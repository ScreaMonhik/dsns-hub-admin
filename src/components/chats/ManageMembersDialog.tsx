import { useEffect, useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, 
  List, ListItem, ListItemAvatar, ListItemText, Avatar, IconButton, 
  Box, Typography, CircularProgress, Tooltip, Switch, Alert,
  Autocomplete, TextField, InputAdornment, DialogContentText
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
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
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Пошук існуючих учасників
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // Додавання нових учасників (Автокомпліт)
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [addOptions, setAddOptions] = useState<User[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [addingUser, setAddingUser] = useState(false);

  // Видалення учасника (Модальне вікно)
  const [memberToDelete, setMemberToDelete] = useState<GroupMember | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchMembers();
    } else {
      setSelectedUser(null);
      setAddSearchQuery('');
      setMemberSearchQuery('');
      setAddOptions([]);
      setApiError(null);
    }
  }, [open, groupId]);

  useEffect(() => {
    if (!open) return;
    
    const handler = setTimeout(async () => {
      if (!addSearchQuery.trim()) {
        setAddOptions([]);
        return;
      }
      
      setLoadingOptions(true);
      try {
        const response = await usersApi.getUsers(1, 20, addSearchQuery);
        // Відфільтровуємо користувачів, які вже є в чаті
        const available = response.data.filter(u => !members.some(m => m.userId === u.id));
        setAddOptions(available);
      } catch (error) {
        console.error('Помилка пошуку користувачів', error);
      } finally {
        setLoadingOptions(false);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [addSearchQuery, members, open]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      setApiError(null);
      const membersData = await chatsApi.getMembers(groupId);
      setMembers(membersData);
    } catch (error: any) {
      setApiError(error.response?.data?.message || 'Помилка завантаження даних');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUser) return;
    setAddingUser(true);
    try {
      setApiError(null);
      const newMember = await chatsApi.addMember(groupId, selectedUser.id);
      
      const memberWithUser = { ...newMember, user: newMember.user || selectedUser };
      
      setMembers(prev => [...prev, memberWithUser]);
      setSelectedUser(null);
      setAddSearchQuery('');
    } catch (error: any) {
      setApiError(error.response?.data?.message || 'Не вдалося додати користувача');
    } finally {
      setAddingUser(false);
    }
  };

  const confirmRemoveMember = async () => {
    if (!memberToDelete) return;
    setDeleting(true);
    try {
      setApiError(null);
      await chatsApi.removeMember(groupId, memberToDelete.userId);
      setMembers(prev => prev.filter(m => m.userId !== memberToDelete.userId));
      setMemberToDelete(null);
    } catch (error: any) {
      setApiError(error.response?.data?.message || 'Не вдалося видалити користувача');
    } finally {
      setDeleting(false);
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

  const filteredMembers = members.filter(m => {
    if (!memberSearchQuery.trim()) return true;
    const q = memberSearchQuery.toLowerCase();
    const fullName = `${m.user?.firstName || ''} ${m.user?.lastName || ''}`.toLowerCase();
    const email = (m.user?.email || '').toLowerCase();
    return fullName.includes(q) || email.includes(q);
  });

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
        <DialogTitle>Учасники чату: {chatName}</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {apiError && <Alert severity="error">{apiError}</Alert>}

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <Autocomplete
              fullWidth
              size="small"
              options={addOptions}
              loading={loadingOptions}
              getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.email})`}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={selectedUser}
              onChange={(_, newValue) => setSelectedUser(newValue)}
              inputValue={addSearchQuery}
              onInputChange={(_, newInputValue) => setAddSearchQuery(newInputValue)}
              disabled={addingUser || loading}
              noOptionsText="Не знайдено (введіть пошту або ім'я)"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Додати учасника (пошук за поштою/ім'ям)"
                  slotProps={{
                    ...params.slotProps,
                    input: {
                      ...((params as any).InputProps || params.slotProps?.input),
                      endAdornment: (
                        <>
                          {loadingOptions ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.slotProps?.input?.endAdornment || (params as any).InputProps?.endAdornment}
                        </>
                      ),
                    },
                  }}
                />
              )}
            />
            <Button 
              variant="contained" 
              onClick={handleAddMember} 
              disabled={!selectedUser || addingUser}
              sx={{ height: 40 }}
            >
              {addingUser ? 'Додавання...' : 'Додати'}
            </Button>
          </Box>

          <TextField
            size="small"
            fullWidth
            placeholder="Пошук серед учасників чату..."
            value={memberSearchQuery}
            onChange={(e) => setMemberSearchQuery(e.target.value)}
            disabled={loading || members.length === 0}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }
            }}
          />

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
              {filteredMembers.map((member) => (
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
                        <IconButton edge="end" color="error" size="small" onClick={() => setMemberToDelete(member)}>
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
              {filteredMembers.length === 0 && (
                <Typography sx={{ textAlign: 'center', py: 2, color: 'text.secondary' }}>
                  {members.length === 0 ? 'В чаті немає учасників' : 'Нікого не знайдено за вашим запитом'}
                </Typography>
              )}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} variant="contained">Закрити</Button>
        </DialogActions>
      </Dialog>

      {/* Модальне вікно попередження при видаленні користувача */}
      <Dialog open={!!memberToDelete} onClose={() => !deleting && setMemberToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Підтвердження видалення</DialogTitle>
        <DialogContent dividers>
          <DialogContentText>
            Ви впевнені, що хочете видалити <strong>{memberToDelete?.user?.firstName} {memberToDelete?.user?.lastName}</strong> з чату? 
            Цю дію не можна скасувати.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMemberToDelete(null)} disabled={deleting}>
            Скасувати
          </Button>
          <Button onClick={confirmRemoveMember} variant="contained" color="error" disabled={deleting}>
            {deleting ? 'Видалення...' : 'Видалити'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};