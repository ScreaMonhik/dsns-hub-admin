import { useEffect, useState, useCallback } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Pagination, CircularProgress,
  OutlinedInput, InputAdornment, IconButton, Tooltip, Chip, Skeleton
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import LockResetIcon from '@mui/icons-material/LockReset';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { format } from 'date-fns';
import { usersApi, type UsersResponse } from '../api/usersApi';
import { CreateUserDialog } from '../components/users/CreateUserDialog';
import { EditUserDialog } from '../components/users/EditUserDialog';
import { ResetPasswordDialog } from '../components/users/ResetPasswordDialog';
import { DeleteUserDialog } from '../components/users/DeleteUserDialog';
import type { User } from '../store/authStore';

export const Users = () => {
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [resetPassUser, setResetPassUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchUsers = useCallback(async (currentPage: number, search: string) => {
    try {
      setLoading(true);
      const result = await usersApi.getUsers(currentPage, 10, search);
      setData(result);
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(page, debouncedSearch);
  }, [page, debouncedSearch, fetchUsers]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Управління користувачами</Typography>
        <Button 
          variant="contained" 
          startIcon={<PersonAddIcon />}
          onClick={() => setIsCreateOpen(true)}
        >
          Додати користувача
        </Button>
      </Box>

      <Paper sx={{ width: '100%', mb: 2, p: 2 }}>
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <OutlinedInput
            size="small"
            placeholder="Шукати за ім'ям або поштою..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startAdornment={
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            }
            sx={{ width: 300 }}
          />
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ім'я та Прізвище</TableCell>
                <TableCell>Електронна пошта</TableCell>
                <TableCell>Роль</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell>Дата реєстрації</TableCell>
                <TableCell align="right">Дії</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell><Skeleton variant="text" width={180} /></TableCell>
                    <TableCell><Skeleton variant="text" width={220} /></TableCell>
                    <TableCell><Skeleton variant="text" width={100} /></TableCell>
                    <TableCell>
                      <Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: 4 }} />
                    </TableCell>
                    <TableCell><Skeleton variant="text" width={120} /></TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Skeleton variant="circular" width={32} height={32} />
                        <Skeleton variant="circular" width={32} height={32} />
                        <Skeleton variant="circular" width={32} height={32} />
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : data?.data.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.role === 'SUPER_ADMIN' 
                      ? 'Супер-адміністратор' 
                      : user.role === 'ADMIN' 
                      ? 'Адміністратор' 
                      : 'Користувач'}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={user.isActive ? 'Активний' : 'Заблокований'} 
                      color={user.isActive ? 'success' : 'error'} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>
                    {user.createdAt && !isNaN(Date.parse(user.createdAt)) 
                      ? format(new Date(user.createdAt), 'dd.MM.yyyy') 
                      : '—'}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Редагувати / Блокувати">
                      <IconButton color="primary" onClick={() => setEditUser(user)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Скинути пароль">
                      <IconButton color="warning" onClick={() => setResetPassUser(user)}>
                        <LockResetIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Видалити">
                      <IconButton color="error" onClick={() => setDeleteUser(user)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && data?.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">Користувачів не знайдено</TableCell>
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

      <CreateUserDialog 
        open={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onSuccess={() => fetchUsers(page, debouncedSearch)} 
      />

      <EditUserDialog 
        open={!!editUser} 
        user={editUser}
        onClose={() => setEditUser(null)} 
        onSuccess={() => fetchUsers(page, debouncedSearch)} 
      />

      <ResetPasswordDialog 
        open={!!resetPassUser} 
        user={resetPassUser}
        onClose={() => setResetPassUser(null)} 
        onSuccess={() => fetchUsers(page, debouncedSearch)}
      />

      <DeleteUserDialog
        open={!!deleteUser}
        user={deleteUser}
        onClose={() => setDeleteUser(null)}
        onSuccess={() => fetchUsers(page, debouncedSearch)}
      />
    </Box>
  );
};