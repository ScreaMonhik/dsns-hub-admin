import { useEffect, useState } from 'react';
import { 
  Box, Typography, Card, CardContent, CircularProgress, Paper, 
  useTheme, Grid, List, ListItem, ListItemText, ListItemAvatar, Avatar, Divider, Chip
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import ArticleIcon from '@mui/icons-material/Article';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { analyticsApi, type DashboardAnalyticsResponse } from '../api/analyticsApi';
import { format } from 'date-fns';

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
    pendingProjects: [
      { id: '1', title: 'Оновлення системи оповіщення населення', authorName: 'Іван Петренко', createdAt: new Date().toISOString() },
      { id: '2', title: 'Закупівля нових пожежних рукавів', authorName: 'Сергій Сидоренко', createdAt: new Date().toISOString() },
    ]
  }
};

const PIE_COLORS = ['#10b981', '#f59e0b', '#64748b'];

export const Dashboard = () => {
  const theme = useTheme();
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
        {/* Головний графік активності */}
        <Grid size={{ xs: 12, lg: 8 }}>
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

        {/* Кругова діаграма статусу проєктів */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ mb: 3 }}>Стан проєктів</Typography>
            <Box sx={{ width: '100%', flexGrow: 1, minHeight: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={projectStatusData}
                    cx="50%"
                    cy="45%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {projectStatusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: 8 }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Останні зареєстровані користувачі */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
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

        {/* Проєкти на модерації */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Очікують публікації (Чернетки)</Typography>
            <List disablePadding>
              {data.recentActivity.pendingProjects.map((project, idx) => (
                <Box key={project.id}>
                  <ListItem disableGutters sx={{ py: 1.5 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                        <PendingActionsIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={<Typography variant="body2" sx={{ fontWeight: 600, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{project.title}</Typography>}
                      secondary={`Автор: ${project.authorName}`} 
                    />
                    <Chip size="small" label="Чернетка" sx={{ ml: 2 }} />
                  </ListItem>
                  {idx < data.recentActivity.pendingProjects.length - 1 && <Divider component="li" />}
                </Box>
              ))}
              {data.recentActivity.pendingProjects.length === 0 && (
                <Typography color="text.secondary" variant="body2" sx={{ py: 2 }}>Усі проєкти опубліковані</Typography>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};