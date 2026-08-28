import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Box } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ArticleIcon from '@mui/icons-material/Article';
import DescriptionIcon from '@mui/icons-material/Description';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import PeopleIcon from '@mui/icons-material/People';
import ChatIcon from '@mui/icons-material/Chat';
import SecurityIcon from '@mui/icons-material/Security';
import CampaignIcon from '@mui/icons-material/Campaign';
import { useCan } from '../../hooks/useCan';

const DRAWER_WIDTH = 240;

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSuperAdmin } = useCan();

  const menuItems = [
    { text: 'Головна', path: '/', icon: <DashboardIcon /> },
    { text: 'Користувачі', path: '/users', icon: <PeopleIcon /> },
    { text: 'Новини', path: '/news', icon: <ArticleIcon /> },
    { text: 'Документи', path: '/documents', icon: <DescriptionIcon /> },
    { text: 'Проєкти', path: '/projects', icon: <AssignmentIcon /> },
    { text: 'Опитування', path: '/polls', icon: <HowToVoteIcon /> },
    { text: 'Чати', path: '/chats', icon: <ChatIcon /> },
    { text: 'Розсилки', path: '/broadcasts', icon: <CampaignIcon /> },
    ...(isSuperAdmin ? [{ text: 'Аудит', path: '/audit-logs', icon: <SecurityIcon /> }] : []),
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: DRAWER_WIDTH, boxSizing: 'border-box' },
      }}
    >
      <Toolbar /> {/* Spacer for Header */}
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {menuItems.map((item) => {
            const isSelected = item.path === '/' 
              ? location.pathname === '/' 
              : location.pathname.startsWith(item.path);

            return (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => navigate(item.path)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Drawer>
  );
};