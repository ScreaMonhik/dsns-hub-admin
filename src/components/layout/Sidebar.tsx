import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Box } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import ArticleIcon from '@mui/icons-material/Article';
import DescriptionIcon from '@mui/icons-material/Description';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import PeopleIcon from '@mui/icons-material/People';
import ChatIcon from '@mui/icons-material/Chat';

const DRAWER_WIDTH = 240;

const menuItems = [
  { text: 'Users', path: '/users', icon: <PeopleIcon /> },
  { text: 'News', path: '/news', icon: <ArticleIcon /> },
  { text: 'Documents', path: '/documents', icon: <DescriptionIcon /> },
  { text: 'Projects', path: '/projects', icon: <AssignmentIcon /> },
  { text: 'Polls', path: '/polls', icon: <HowToVoteIcon /> },
  { text: 'Chats', path: '/chats', icon: <ChatIcon /> },
];

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname.startsWith(item.path)}
                onClick={() => navigate(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};