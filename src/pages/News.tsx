import { useEffect, useState, useCallback } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Pagination, CircularProgress,
  IconButton, Tooltip, Chip, MenuItem, TextField
} from '@mui/material';
import ArticleIcon from '@mui/icons-material/Article';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { newsApi, type NewsStatus, type News as NewsType, type NewsCategory, type NewsListResponse } from '../api/newsApi';
import { NewsFormDialog } from '../components/news/NewsFormDialog';
import { DeleteNewsDialog } from '../components/news/DeleteNewsDialog';
import { format } from 'date-fns';

export const News = () => {
  const [data, setData] = useState<NewsListResponse | null>(null);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<NewsStatus | ''>('');
  
  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editNews, setEditNews] = useState<NewsType | null>(null);
  const [deleteNewsItem, setDeleteNewsItem] = useState<NewsType | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [newsRes, catsRes] = await Promise.all([
        newsApi.getNews(page, 10, filterCategory || undefined, filterStatus || undefined),
        newsApi.getCategories()
      ]);
      setData(newsRes);
      setCategories(catsRes);
    } catch (error) {
      console.error('Failed to fetch news data', error);
    } finally {
      setLoading(false);
    }
  }, [page, filterCategory, filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openDelete = (news: NewsType) => {
    setDeleteNewsItem(news);
  };

  const openEdit = (news: NewsType) => {
    setEditNews(news);
    setIsFormOpen(true);
  };

  const openCreate = () => {
    setEditNews(null);
    setIsFormOpen(true);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Управління новинами</Typography>
        <Button variant="contained" startIcon={<ArticleIcon />} onClick={openCreate}>
          Додати новину
        </Button>
      </Box>

      <Paper sx={{ width: '100%', mb: 2, p: 2 }}>
        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <TextField select size="small" label="Фільтр за категорією" value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }} sx={{ minWidth: 200 }}>
            <MenuItem value="">Всі категорії</MenuItem>
            {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Фільтр за статусом" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value as NewsStatus | ''); setPage(1); }} sx={{ minWidth: 200 }}>
            <MenuItem value="">Всі статуси</MenuItem>
            <MenuItem value="PUBLISHED">Опубліковано</MenuItem>
            <MenuItem value="DRAFT">Чернетка</MenuItem>
          </TextField>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Заголовок</TableCell>
                <TableCell>Категорія</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell>Автор</TableCell>
                <TableCell>Дата створення</TableCell>
                <TableCell align="right">Дії</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}><CircularProgress /></TableCell></TableRow>
              ) : data?.data.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell sx={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.title}
                  </TableCell>
                  <TableCell>{item.category?.name || '—'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={item.status === 'PUBLISHED' ? 'Опубліковано' : 'Чернетка'} 
                      color={item.status === 'PUBLISHED' ? 'success' : 'default'} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>{`${item.author.firstName} ${item.author.lastName}`}</TableCell>
                  <TableCell>{format(new Date(item.createdAt), 'dd.MM.yyyy HH:mm')}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Редагувати">
                      <IconButton color="primary" onClick={() => openEdit(item)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Видалити">
                      <IconButton color="error" onClick={() => openDelete(item)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && data?.data.length === 0 && (
                <TableRow><TableCell colSpan={6} align="center">Новин не знайдено</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {data && data.meta.lastPage > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2, pt: 3 }}>
            <Pagination count={data.meta.lastPage} page={page} onChange={(_, val) => setPage(val)} color="primary" />
          </Box>
        )}
      </Paper>

      <NewsFormDialog 
        open={isFormOpen} 
        news={editNews} 
        categories={categories}
        onClose={() => setIsFormOpen(false)} 
        onSuccess={fetchData} 
      />

      <DeleteNewsDialog
        open={!!deleteNewsItem}
        news={deleteNewsItem}
        onClose={() => setDeleteNewsItem(null)}
        onSuccess={fetchData}
      />
    </Box>
  );
};