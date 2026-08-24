import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Pagination, Typography, Card, CardContent, CircularProgress, Paper, 
  useTheme, Grid, List, ListItem, ListItemText, ListItemAvatar, Avatar, Divider, Chip, ListItemButton, TextField, MenuItem, Button, Menu, Skeleton
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import ArticleIcon from '@mui/icons-material/Article';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import DescriptionIcon from '@mui/icons-material/Description';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { analyticsApi, type DashboardAnalyticsResponse, type DraftEntityType } from '../api/analyticsApi';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Configuration for rendering different draft entity types
const ENTITY_CONFIG: Record<DraftEntityType, { icon: ReactNode; color: string; label: string; path: string }> = {
  NEWS: { icon: <ArticleIcon />, color: '#3b82f6', label: 'Новина', path: '/news' },
  PROJECT: { icon: <AssignmentIcon />, color: '#f59e0b', label: 'Проєкт', path: '/projects' },
  POLL: { icon: <HowToVoteIcon />, color: '#8b5cf6', label: 'Опитування', path: '/polls' },
  DOCUMENT: { icon: <DescriptionIcon />, color: '#ef4444', label: 'Документ', path: '/documents' },
};

// Fallback data in case the backend is not ready yet
// Динамічний генератор мокових даних графіка для тестування фільтрів
const generateMockChartData = (startDateStr?: string, endDateStr?: string, period?: string) => {
  const end = endDateStr ? new Date(endDateStr) : new Date();
  const start = startDateStr ? new Date(startDateStr) : new Date();
  if (!startDateStr) start.setDate(end.getDate() - 14);

  // Спеціальна логіка для графіка за рік (по місяцях)
  if (period === 'year') {
    return Array.from({ length: 12 }).map((_, i) => {
      const d = new Date(end);
      d.setMonth(d.getMonth() - (11 - i));
      return {
        date: format(d, 'MMM yy', { locale: uk }),
        newUsers: Math.floor(Math.random() * 150) + 50,
        newProjects: Math.floor(Math.random() * 30) + 10,
        votes: Math.floor(Math.random() * 4000) + 1000,
        engagements: Math.floor(Math.random() * 2500) + 500,
        comments: Math.floor(Math.random() * 800) + 100,
      };
    });
  }

  // Логіка для інших періодів (по днях)
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  
  const pointsCount = diffDays > 31 ? 30 : diffDays;
  const step = diffDays / pointsCount;

  return Array.from({ length: pointsCount }).map((_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + (i * step));
    return {
      date: format(d, 'dd.MM.yy'),
      newUsers: Math.floor(Math.random() * 20),
      newProjects: Math.floor(Math.random() * 5),
      votes: Math.floor(Math.random() * 500) + 50,
      engagements: Math.floor(Math.random() * 300) + 10,
      comments: Math.floor(Math.random() * 100) + 5,
    };
  });
};

const MOCK_DATA: DashboardAnalyticsResponse = {
  summary: {
    users: { total: 1250, active: 1200, blocked: 45, admins: 5 },
    projects: { total: 142, draft: 12, published: 98, archived: 32 },
    news: { total: 350, draft: 5, published: 300, archived: 45 },
    polls: { total: 45, active: 5, archived: 40, totalVotes: 15420 }
  },
  activityChart: [], // Буде заповнено динамічно
  recentActivity: {
    latestUsers: [
      { id: '1', firstName: 'Олександр', lastName: 'Коваленко', email: 'o.kovalenko@dsns.gov.ua', createdAt: new Date().toISOString() },
      { id: '2', firstName: 'Марія', lastName: 'Шевченко', email: 'm.shevchenko@dsns.gov.ua', createdAt: new Date().toISOString() },
    ],
    pendingDrafts: [
      { id: '1', title: 'Оновлення системи оповіщення', type: 'PROJECT', authorName: 'Іван Петренко', createdAt: new Date().toISOString() },
      { id: '2', title: 'Вказівки щодо пожежної безпеки', type: 'DOCUMENT', authorName: 'Марія Коваль', createdAt: new Date().toISOString() },
      { id: '3', title: 'Результати перевірки укриттів', type: 'NEWS', authorName: 'Сергій Сидоренко', createdAt: new Date().toISOString() },
    ]
  }
};

const STATUS_COLORS = {
  projects: ['#10b981', '#f59e0b', '#64748b'],
  news: ['#3b82f6', '#f59e0b', '#64748b'],
  users: ['#10b981', '#ef4444'],
  polls: ['#8b5cf6', '#64748b']
};

interface StatusPieChartProps {
  title: string;
  data: { name: string; value: number }[];
  colors: string[];
}

const StatusPieChart = ({ title, data, colors }: StatusPieChartProps) => (
  <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
    <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem', fontWeight: 600, textAlign: 'center' }}>
      {title}
    </Typography>
    <Box sx={{ width: '100%', flexGrow: 1, minHeight: 220, '& *, & *:focus, & *:active': { outline: 'none !important' } }}>
      <ResponsiveContainer>
        <PieChart style={{ outline: 'none' }}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            style={{ outline: 'none' }}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} style={{ outline: 'none' }} />
            ))}
          </Pie>
          <RechartsTooltip contentStyle={{ borderRadius: 8 }} />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  </Paper>
);

export const Dashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Стейт для пагінації чернеток (MUI Pagination починається з 1)
  const [draftsPage, setDraftsPage] = useState(1);
  const DRAFTS_PER_PAGE = 5;

  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const [exporting, setExporting] = useState<boolean>(false);

  const [period, setPeriod] = useState<string>('14days');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  const [activeLines, setActiveLines] = useState<Record<string, boolean>>({
    votes: true,
    newUsers: true,
    engagements: true,
    comments: true,
  });

  const toggleLine = (key: string) => {
    setActiveLines(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Тепер функція приймає поточні значення як аргументи (чиста функція)
  const getDatesForApi = (currentPeriod: string, currentCustomRange: { start: string; end: string }) => {
    const end = new Date();
    end.setHours(23, 59, 59, 999); // Фіксуємо самий кінець поточного дня

    const start = new Date();
    start.setHours(0, 0, 0, 0); // Фіксуємо самий початок стартового дня

    switch (currentPeriod) {
      case 'month':
        start.setMonth(end.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(end.getFullYear() - 1);
        break;
      case 'custom':
        if (currentCustomRange.start && currentCustomRange.end) {
          return {
            startDate: new Date(new Date(currentCustomRange.start).setHours(0, 0, 0, 0)).toISOString(),
            endDate: new Date(new Date(currentCustomRange.end).setHours(23, 59, 59, 999)).toISOString()
          };
        }
        start.setDate(end.getDate() - 14);
        break;
      case '14days':
      default:
        start.setDate(end.getDate() - 14);
        break;
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString()
    };
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    setExportAnchorEl(null);
    try {
      setExporting(true);
      // Передаємо актуальні значення зі стейту
      const { startDate, endDate } = getDatesForApi(period, customRange);
      await analyticsApi.exportDashboard(format, startDate, endDate);
    } catch (error) {
      console.error('Failed to export data', error);
      import('react-hot-toast').then(({ default: toast }) => {
        toast.error('Помилка експорту. Можливо, бекенд ще не підтримує цю функцію.');
      });
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    // Додаємо параметр isSilent, щоб знати, чи це фонове оновлення
    const fetchStats = async (isSilent = false) => {
      try {
        // Показуємо лоадер ТІЛЬКИ якщо це перше завантаження (не фонове)
        if (!isSilent) setLoading(true);
        
        if (period === 'custom' && (!customRange.start || !customRange.end)) {
          if (!isSilent) setLoading(false);
          return;
        }

        // Передаємо актуальні значення зі стейту прямо у функцію
        const { startDate, endDate } = getDatesForApi(period, customRange);
        const res = await analyticsApi.getDashboardData(startDate, endDate);
        
        // Використовуємо реальні нормалізовані дані з бекенду
        // React автоматично перемалює лише змінені цифри, екран не блиматиме
        setData(res);
      } catch (error: any) {
        console.warn('Backend analytics not ready, using mock data.');
        const { startDate, endDate } = getDatesForApi(period, customRange);
        setData({
          ...MOCK_DATA,
          activityChart: generateMockChartData(startDate, endDate, period)
        });
      } finally {
        if (!isSilent) setLoading(false);
      }
    };

    // 1. Початкове завантаження при відкритті сторінки або зміні фільтру
    fetchStats(false);

    // 2. Налаштування фонового опитування (Polling) кожні 60 секунд
    const intervalId = setInterval(() => {
      fetchStats(true); // true означає "фонове оновлення без лоадера"
    }, 60000);

    // 3. Очищення таймера при закритті сторінки або зміні фільтрів (щоб не було витоку пам'яті)
    return () => clearInterval(intervalId);
  }, [period, customRange]); // Оновлюємо дані при зміні періоду

  if (!data) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Заголовок та кнопка експорту */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton variant="text" width={240} height={40} />
          <Skeleton variant="rounded" width={140} height={36} />
        </Box>

        {/* 4 Картки основних показників */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 3 }}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <Card key={idx}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ width: '60%' }}>
                  <Skeleton variant="text" width="80%" height={20} />
                  <Skeleton variant="text" width="60%" height={40} />
                  <Skeleton variant="text" width="50%" height={16} />
                </Box>
                <Skeleton variant="rounded" width={48} height={48} />
              </CardContent>
            </Card>
          ))}
        </Box>

        <Grid container spacing={3}>
          {/* Головний графік */}
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Skeleton variant="text" width={200} height={32} />
                <Skeleton variant="rounded" width={180} height={36} />
              </Box>
              <Skeleton variant="rounded" width="100%" height={350} />
            </Paper>
          </Grid>

          {/* 4 Кругові діаграми */}
          {Array.from({ length: 4 }).map((_, idx) => (
            <Grid key={idx} size={{ xs: 12, sm: 6, lg: 3 }}>
              <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Skeleton variant="text" width={120} height={24} sx={{ mb: 2 }} />
                <Skeleton variant="circular" width={160} height={160} />
              </Paper>
            </Grid>
          ))}

          {/* Список нових співробітників */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, height: '100%', minHeight: 525 }}>
              <Skeleton variant="text" width={180} height={32} sx={{ mb: 2 }} />
              <List disablePadding sx={{ height: 380 }}>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <ListItem key={idx} disableGutters sx={{ height: 72 }}>
                    <ListItemAvatar>
                      <Skeleton variant="circular" width={40} height={40} />
                    </ListItemAvatar>
                    <ListItemText 
                      primary={<Skeleton variant="text" width="60%" />} 
                      secondary={<Skeleton variant="text" width="40%" />} 
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Список чернеток */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, height: '100%', minHeight: 525 }}>
              <Skeleton variant="text" width={220} height={32} sx={{ mb: 2 }} />
              <List disablePadding sx={{ height: 380 }}>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <ListItem key={idx} disablePadding sx={{ height: 72 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', px: 2 }}>
                      <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Skeleton variant="text" width="70%" />
                        <Skeleton variant="text" width="40%" />
                      </Box>
                      <Skeleton variant="rounded" width={60} height={24} />
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  }

  const statCards = [
    { title: 'Всього користувачів', value: data.summary.users.total, subValue: `${data.summary.users.active} активних`, icon: <PeopleIcon fontSize="large" />, color: theme.palette.primary.main },
    { title: 'Опубліковані новини', value: data.summary.news.published, subValue: `${data.summary.news.draft} чернеток`, icon: <ArticleIcon fontSize="large" />, color: theme.palette.success.main },
    { title: 'Активні проєкти', value: data.summary.projects.published, subValue: `${data.summary.projects.draft} очікують`, icon: <AssignmentIcon fontSize="large" />, color: theme.palette.warning.main },
    { title: 'Голоси в опитуваннях', value: data.summary.polls.totalVotes, subValue: `${data.summary.polls.active} активних опитувань`, icon: <HowToVoteIcon fontSize="large" />, color: theme.palette.info.main },
  ];

  const projectStatusData = [
    { name: 'Опубліковано', value: data.summary.projects.published },
    { name: 'Чернетки', value: data.summary.projects.draft },
    { name: 'В архіві', value: data.summary.projects.archived },
  ];

  const newsStatusData = [
    { name: 'Опубліковано', value: data.summary.news.published },
    { name: 'Чернетки', value: data.summary.news.draft },
    { name: 'В архіві', value: data.summary.news.archived },
  ];

  const userStatusData = [
    { name: 'Активні', value: data.summary.users.active },
    { name: 'Заблоковані', value: data.summary.users.blocked },
  ];

  const pollStatusData = [
    { name: 'Активні', value: data.summary.polls.active },
    { name: 'В архіві', value: data.summary.polls.archived },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4">Аналітична панель</Typography>
        <Button 
          variant="outlined" 
          startIcon={exporting ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
          onClick={(e) => setExportAnchorEl(e.currentTarget)}
          disabled={exporting}
        >
          Експорт звіту
        </Button>
        <Menu
          anchorEl={exportAnchorEl}
          open={Boolean(exportAnchorEl)}
          onClose={() => setExportAnchorEl(null)}
        >
          <MenuItem onClick={() => handleExport('pdf')}>
            <PictureAsPdfIcon sx={{ mr: 1, color: 'error.main' }} fontSize="small" /> 
            Завантажити PDF
          </MenuItem>
          <MenuItem onClick={() => handleExport('csv')}>
            <TableChartIcon sx={{ mr: 1, color: 'success.main' }} fontSize="small" /> 
            Завантажити CSV (Excel)
          </MenuItem>
        </Menu>
      </Box>

      {/* Головні показники */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 3 }}>
        {statCards.map((card, index) => (
          <Card key={index} sx={{ transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CardContent sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                  {card.title}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  {card.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {card.subValue}
                </Typography>
              </Box>
              <Box sx={{ color: card.color, display: 'flex', opacity: 0.8, p: 1, bgcolor: `${card.color}15`, borderRadius: 2 }}>
                {card.icon}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Grid container spacing={3}>
        {/* Головний графік активності на всю ширину */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            
            {/* Панель керування фільтрами графіка */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="h6">Динаміка залученості</Typography>
                  {loading && <CircularProgress size={16} />}
                </Box>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                  <TextField
                    select
                    size="small"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    sx={{ minWidth: 180 }}
                  >
                    <MenuItem value="14days">Останні 14 днів</MenuItem>
                    <MenuItem value="month">Останній місяць</MenuItem>
                    <MenuItem value="year">Останній рік</MenuItem>
                    <MenuItem value="custom">Довільний період</MenuItem>
                  </TextField>
                  
                  {period === 'custom' && (
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={uk}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <DatePicker
                          label="З"
                          value={customRange.start ? new Date(customRange.start) : null}
                          onChange={(newValue) => setCustomRange(p => ({ ...p, start: newValue ? (newValue as Date).toISOString() : '' }))}
                          slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
                        />
                        <DatePicker
                          label="По"
                          value={customRange.end ? new Date(customRange.end) : null}
                          onChange={(newValue) => setCustomRange(p => ({ ...p, end: newValue ? (newValue as Date).toISOString() : '' }))}
                          minDate={customRange.start ? new Date(customRange.start) : undefined}
                          slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
                        />
                      </Box>
                    </LocalizationProvider>
                  )}
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label="Голоси в опитуваннях" 
                  onClick={() => toggleLine('votes')}
                  color="info"
                  variant={activeLines.votes ? 'filled' : 'outlined'}
                  sx={{ opacity: activeLines.votes ? 1 : 0.5 }}
                />
                <Chip 
                  label="Оцінки (Лайки/Дизлайки)" 
                  onClick={() => toggleLine('engagements')}
                  color="success"
                  variant={activeLines.engagements ? 'filled' : 'outlined'}
                  sx={{ opacity: activeLines.engagements ? 1 : 0.5 }}
                />
                <Chip 
                  label="Коментарі" 
                  onClick={() => toggleLine('comments')}
                  color="warning"
                  variant={activeLines.comments ? 'filled' : 'outlined'}
                  sx={{ opacity: activeLines.comments ? 1 : 0.5 }}
                />
                <Chip 
                  label="Нові користувачі" 
                  onClick={() => toggleLine('newUsers')}
                  color="primary"
                  variant={activeLines.newUsers ? 'filled' : 'outlined'}
                  sx={{ opacity: activeLines.newUsers ? 1 : 0.5 }}
                />
              </Box>
            </Box>
            <Box sx={{ width: '100%', height: 350, mt: 2, '& *, & *:focus, & *:active': { outline: 'none !important' } }}>
              <ResponsiveContainer>
                <AreaChart 
                  data={data.activityChart} 
                  margin={{ top: 5, right: 20, bottom: 5, left: 0 }} 
                  style={{ outline: 'none' }}
                >
                  <defs>
                    <linearGradient id="colorVotes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.palette.info.main} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={theme.palette.info.main} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorEngagements" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.palette.warning.main} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={theme.palette.warning.main} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
                  <XAxis dataKey="date" stroke={theme.palette.text.secondary} fontSize={12} tickMargin={10} />
                  <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: theme.palette.background.paper, borderColor: theme.palette.divider, borderRadius: 8 }}
                    itemStyle={{ color: theme.palette.text.primary }}
                    cursor={{ stroke: theme.palette.divider, strokeWidth: 1, fill: 'transparent' }}
                    itemSorter={(item) => ['votes', 'engagements', 'comments', 'newUsers'].indexOf(item.dataKey as string)}
                  />
                  {activeLines.votes && <Area type="monotone" name="Голоси в опитуваннях" dataKey="votes" stroke={theme.palette.info.main} fillOpacity={1} fill="url(#colorVotes)" strokeWidth={2} />}
                  {activeLines.engagements && <Area type="monotone" name="Оцінки (Лайки/Дизлайки)" dataKey="engagements" stroke={theme.palette.success.main} fillOpacity={1} fill="url(#colorEngagements)" strokeWidth={2} />}
                  {activeLines.comments && <Area type="monotone" name="Коментарі" dataKey="comments" stroke={theme.palette.warning.main} fillOpacity={1} fill="url(#colorComments)" strokeWidth={2} />}
                  {activeLines.newUsers && <Area type="monotone" name="Нові користувачі" dataKey="newUsers" stroke={theme.palette.primary.main} fill="none" strokeWidth={2} />}
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* 4 Симетричні кругові діаграми */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatusPieChart title="Стан проєктів" data={projectStatusData} colors={STATUS_COLORS.projects} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatusPieChart title="Стан новин" data={newsStatusData} colors={STATUS_COLORS.news} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatusPieChart title="Опитування" data={pollStatusData} colors={STATUS_COLORS.polls} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatusPieChart title="Користувачі" data={userStatusData} colors={STATUS_COLORS.users} />
        </Grid>

        {/* Останні зареєстровані користувачі */}
        <Grid size={{ xs: 12, md: 6 }}>
          {/* Додаємо таку ж мінімальну висоту картки, як і у чернеток */}
          <Paper sx={{ p: 3, height: '100%', minHeight: 525, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Нові співробітники</Typography>
            <List disablePadding sx={{ height: 380, overflow: 'hidden' }}>
              {data.recentActivity.latestUsers.map((user, idx) => (
                <Box key={user.id}>
                  {/* Задаємо жорстку висоту 72px для ідеального вирівнювання */}
                  <ListItem disableGutters sx={{ height: 72 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <AccountCircleIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={`${user.firstName} ${user.lastName}`} 
                      secondary={user.email} 
                    />
                    <Typography variant="caption" color="text.secondary">
                      {format(new Date(user.createdAt), 'dd.MM')}
                    </Typography>
                  </ListItem>
                  {idx < data.recentActivity.latestUsers.length - 1 && <Divider component="li" />}
                </Box>
              ))}
              {data.recentActivity.latestUsers.length === 0 && (
                <Typography color="text.secondary" variant="body2" sx={{ py: 2 }}>Немає нових реєстрацій</Typography>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Матеріали на модерації */}
        <Grid size={{ xs: 12, md: 6 }}>
          {/* Фіксуємо мінімальну висоту всієї картки (приблизно 525px, як для 5 елементів) */}
          <Paper sx={{ p: 3, height: '100%', minHeight: 525, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Очікують публікації (Чернетки)</Typography>
            
            {(() => {
              const drafts = data.recentActivity.pendingDrafts || [];
              const totalPages = Math.ceil(drafts.length / DRAFTS_PER_PAGE);
              const startIndex = (draftsPage - 1) * DRAFTS_PER_PAGE;
              const currentDrafts = drafts.slice(startIndex, startIndex + DRAFTS_PER_PAGE);

              if (drafts.length === 0) {
                return <Typography color="text.secondary" variant="body2" sx={{ py: 2 }}>Нових матеріалів на розгляді немає</Typography>;
              }

              return (
                <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  {/* Замість minHeight задаємо жорстку висоту для списку та обрізаємо зайве */}
                  <List disablePadding sx={{ height: 380, overflow: 'hidden' }}>
                    {currentDrafts.map((draft, idx) => {
                      const config = ENTITY_CONFIG[draft.type];
                      return (
                        <Box key={`${draft.type}-${draft.id}`}>
                          {/* Задаємо жорстку висоту 72px для ідеального вирівнювання */}
                          <ListItem disablePadding sx={{ height: 72 }}>
                            <ListItemButton 
                              onClick={() => navigate(`${config.path}?edit=${draft.id}`)}
                              sx={{ borderRadius: 1, height: '100%' }}
                            >
                              <ListItemAvatar>
                                <Avatar sx={{ bgcolor: `${config.color}15`, color: config.color }}>
                                  {config.icon}
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText 
                                primary={
                                  <Typography variant="body2" sx={{ fontWeight: 600, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {draft.title}
                                  </Typography>
                                }
                                secondary={`Автор: ${draft.authorName}`} 
                              />
                              <Chip 
                                size="small" 
                                label={config.label} 
                                sx={{ ml: 2, bgcolor: `${config.color}20`, color: config.color, fontWeight: 500 }} 
                              />
                            </ListItemButton>
                          </ListItem>
                          {idx < currentDrafts.length - 1 && <Divider component="li" />}
                        </Box>
                      );
                    })}
                  </List>
                  
                  {totalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 'auto', pt: 2 }}>
                      <Pagination 
                        count={totalPages} 
                        page={draftsPage} 
                        onChange={(_, value) => setDraftsPage(value)} 
                        color="primary" 
                        size="small" 
                      />
                    </Box>
                  )}
                </Box>
              );
            })()}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};