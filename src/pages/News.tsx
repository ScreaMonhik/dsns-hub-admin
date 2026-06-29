import { useEffect, useState, useCallback } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Pagination, CircularProgress,
  IconButton, Tooltip, Chip, MenuItem, TextField,
  ToggleButton, ToggleButtonGroup, Card, CardContent, CardMedia, CardActions
} from '@mui/material';
import ArticleIcon from '@mui/icons-material/Article';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ViewListIcon from '@mui/icons-material/ViewList';
import GridViewIcon from '@mui/icons-material/GridView';
import { SecureImage } from '../components/common/SecureImage';
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
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  
  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editNews, setEditNews] = useState<NewsType | null>(null);
  const [deleteNewsItem, setDeleteNewsItem] = useState<NewsType | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [newsRes, catsRes] = await Promise.all([
        newsApi.getNews(page, 10, filterCategory || undefined, filterStatus || undefined, sortBy, sortOrder),
        newsApi.getCategories()
      ]);
      setData(newsRes);
      setCategories(catsRes);
    } catch (error) {
      console.error('Failed to fetch news data', error);
    } finally {
      setLoading(false);
    }
  }, [page, filterCategory, filterStatus, sortBy, sortOrder]);

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
        <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField select size="small" label="Категорія" value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }} sx={{ minWidth: 160 }}>
              <MenuItem value="">Всі категорії</MenuItem>
              {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="Статус" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value as NewsStatus | ''); setPage(1); }} sx={{ minWidth: 160 }}>
              <MenuItem value="">Всі статуси</MenuItem>
              <MenuItem value="PUBLISHED">Опубліковано</MenuItem>
              <MenuItem value="DRAFT">Чернетка</MenuItem>
            </TextField>
            <TextField select size="small" label="Сортувати за" value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }} sx={{ minWidth: 160 }}>
              <MenuItem value="createdAt">Датою створення</MenuItem>
              <MenuItem value="authorId">Автором</MenuItem>
            </TextField>
            <TextField select size="small" label="Порядок" value={sortOrder} onChange={(e) => { setSortOrder(e.target.value as 'ASC' | 'DESC'); setPage(1); }} sx={{ minWidth: 160 }}>
              <MenuItem value="DESC">За спаданням</MenuItem>
              <MenuItem value="ASC">За зростанням</MenuItem>
            </TextField>
          </Box>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, newMode) => { if (newMode) setViewMode(newMode); }}
            size="small"
          >
            <ToggleButton value="table" aria-label="table view"><ViewListIcon /></ToggleButton>
            <ToggleButton value="grid" aria-label="grid view"><GridViewIcon /></ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
        ) : viewMode === 'table' ? (
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
              {data?.data.length === 0 && (
                <TableRow><TableCell colSpan={6} align="center">Новин не знайдено</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
            {data?.data.map((item) => (
              <Card key={item.id} sx={{ display: 'flex', flexDirection: 'column' }}>
  
  {/* Використовуємо SecureImage напряму замість CardMedia */}
  <SecureImage
    src={item.imageUrl ?? undefined}
    alt={item.title}
    style={{ 
      width: '100%', 
      height: '160px', 
      objectFit: 'cover' 
    }}
  />

  <CardContent sx={{ flexGrow: 1 }}>
    <Typography variant="h6" component="div" sx={{ mb: 1, fontSize: '1.1rem', lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
      {item.title}
    </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                    <Chip size="small" label={item.category?.name || 'Без категорії'} variant="outlined" />
                    <Chip size="small" label={item.status === 'PUBLISHED' ? 'Опубліковано' : 'Чернетка'} color={item.status === 'PUBLISHED' ? 'success' : 'default'} />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Автор: {item.author.firstName} {item.author.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {format(new Date(item.createdAt), 'dd.MM.yyyy HH:mm')}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end', borderTop: 1, borderColor: 'divider' }}>
                  <Tooltip title="Редагувати">
                    <IconButton size="small" color="primary" onClick={() => openEdit(item)}><EditIcon fontSize="small" /></IconButton>
                  </Tooltip>
                  <Tooltip title="Видалити">
                    <IconButton size="small" color="error" onClick={() => openDelete(item)}><DeleteIcon fontSize="small" /></IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            ))}
            {data?.data.length === 0 && (
              <Typography sx={{ gridColumn: '1 / -1', textAlign: 'center', py: 4 }}>Новин не знайдено</Typography>
            )}
          </Box>
        )}
        
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
        onRefreshCategories={fetchData}
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