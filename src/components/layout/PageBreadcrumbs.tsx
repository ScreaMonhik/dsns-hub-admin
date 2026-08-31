import { Breadcrumbs, Typography, Box, Link } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';

const routeNames: Record<string, string> = {
  'users': 'Користувачі',
  'news': 'Новини',
  'documents': 'Документи',
  'projects': 'Проєкти',
  'polls': 'Опитування',
  'chats': 'Чати',
  'broadcasts': 'Розсилки',
  'audit-logs': 'Журнал аудиту',
  'profile': 'Особистий кабінет',
  'settings': 'Налаштування системи',
};

export const PageBreadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Не показуємо крихти на головній сторінці (Dashboard)
  if (pathnames.length === 0) return null;

  return (
    <Box sx={{ mb: 2 }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
        <Link 
          component={RouterLink} 
          to="/" 
          color="inherit" 
          underline="hover" 
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
          Головна
        </Link>
        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const name = routeNames[value] || value;

          return last ? (
            <Typography color="text.primary" key={to} sx={{ display: 'flex', alignItems: 'center' }}>
              {name}
            </Typography>
          ) : (
            <Link 
              component={RouterLink} 
              to={to} 
              key={to} 
              color="inherit" 
              underline="hover"
            >
              {name}
            </Link>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
};