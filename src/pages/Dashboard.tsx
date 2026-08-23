import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Card, CardContent, CircularProgress, Paper, 
  useTheme, Grid, List, ListItem, ListItemText, ListItemAvatar, Avatar, Divider, Chip, ListItemButton
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
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

// Configuration for rendering different draft entity types
const ENTITY_CONFIG: Record<DraftEntityType, { icon: ReactNode; color: string; label: string; path: string }> = {
  NEWS: { icon: <ArticleIcon />, color: '#3b82f6', label: 'Новина', path: '/news' },
  PROJECT: { icon: <AssignmentIcon />, color: '#f59e0b', label: 'Проєкт', path: '/projects' },
  POLL: { icon: <HowToVoteIcon />, color: '#8b5cf6', label: 'Опитування', path: '/polls' },
  DOCUMENT: { icon: <DescriptionIcon />, color: '#ef4444', label: 'Документ', path: '/documents' },
};

// Fallback data in case the backend is not ready yet
const MOCK_DATA: DashboardAnalyticsResponse = {
  summary: {
    users: { total: 1250, active: 1200, blocked: 45, admins: 5 },
    projects: { total: 142, draft: 12, published: 98, archived: 32 },
    news: { total: 350, draft: 5, published: 300, archived: 45 },
    polls: { total: 45, active: 5, archived: 40, totalVotes: 15420 }
  },
  activityChart: Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return {
      date: format(d, 'dd.MM'),
      newUsers: Math.floor(Math.random() * 20),
      newProjects: Math.floor(Math.random() * 5),
      votes: Math.floor(Math.random() * 500) + 50,
    };
  }),
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
    <Box sx={{ width: '100%', flexGrow: 1, minHeight: 220 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await analyticsApi.getDashboardData();
        setData(res);
      } catch (error: any) {
        console.warn('Backend analytics not ready, using mock data. Error:', error.message);
        setData(MOCK_DATA);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading || !data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
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
      <Typography variant="h4">Аналітична панель</Typography>

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
            <Typography variant="h6" sx={{ mb: 3 }}>Динаміка залученості (останні 14 днів)</Typography>
            <Box sx={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                <AreaChart data={data.activityChart} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="colorVotes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.palette.info.main} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={theme.palette.info.main} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
                  <XAxis dataKey="date" stroke={theme.palette.text.secondary} fontSize={12} tickMargin={10} />
                  <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: theme.palette.background.paper, borderColor: theme.palette.divider, borderRadius: 8 }}
                    itemStyle={{ color: theme.palette.text.primary }}
                  />
                  <Area type="monotone" name="Голоси в опитуваннях" dataKey="votes" stroke={theme.palette.info.main} fillOpacity={1} fill="url(#colorVotes)" strokeWidth={2} />
                  <Area type="monotone" name="Нові користувачі" dataKey="newUsers" stroke={theme.palette.primary.main} fill="none" strokeWidth={2} />
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
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Нові співробітники</Typography>
            <List disablePadding>
              {data.recentActivity.latestUsers.map((user, idx) => (
                <Box key={user.id}>
                  <ListItem disableGutters sx={{ py: 1.5 }}>
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
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Очікують публікації (Чернетки)</Typography>
            <List disablePadding>
              {data.recentActivity.pendingDrafts.map((draft, idx) => {
                const config = ENTITY_CONFIG[draft.type];
                
                return (
                  <Box key={`${draft.type}-${draft.id}`}>
                    <ListItem disablePadding sx={{ py: 0.5 }}>
                      <ListItemButton 
                        onClick={() => navigate(`${config.path}?edit=${draft.id}`)}
                        sx={{ borderRadius: 1 }}
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
                    {idx < data.recentActivity.pendingDrafts.length - 1 && <Divider component="li" />}
                  </Box>
                );
              })}
              {data.recentActivity.pendingDrafts.length === 0 && (
                <Typography color="text.secondary" variant="body2" sx={{ py: 2 }}>Нових матеріалів на розгляді немає</Typography>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};