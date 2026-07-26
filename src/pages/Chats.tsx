import { useEffect, useState, useCallback } from 'react';
import { 
  Box, Typography, Button, Paper, List, ListItem, ListItemAvatar, 
  ListItemText, Avatar, CircularProgress, Divider 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { chatsApi, type ChatGroup } from '../api/chatsApi';
import { CreateChatDialog } from '../components/chats/CreateChatDialog';
import { ChatWindow } from '../components/chats/ChatWindow';
import { SecureImage } from '../components/common/SecureImage';

export const Chats = () => {
  const [chats, setChats] = useState<ChatGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<ChatGroup | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchChats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await chatsApi.getAllGroups();
      setChats(data);
    } catch (error) {
      console.error('Failed to fetch chats', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 100px)', gap: 2 }}>
      {/* Ліва панель зі списком чатів */}
      <Paper sx={{ width: 350, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">Усі чати</Typography>
          <Button size="small" variant="contained" onClick={() => setIsCreateOpen(true)}>
            <AddIcon />
          </Button>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : (
          <List sx={{ flexGrow: 1, overflowY: 'auto', p: 0 }}>
            {chats.map((chat) => (
              <Box key={chat.id}>
                <ListItem 
                  component="div"
                  onClick={() => setSelectedChat(chat)}
                  sx={{ 
                    cursor: 'pointer',
                    bgcolor: selectedChat?.id === chat.id ? 'action.selected' : 'transparent',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {chat.avatarUrl ? (
                        <SecureImage src={chat.avatarUrl} alt={chat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        chat.name.charAt(0)
                      )}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={chat.name} 
                    secondary={chat.createdAt ? `Створено: ${new Date(chat.createdAt).toLocaleDateString()}` : ''} 
                  />
                </ListItem>
                <Divider />
              </Box>
            ))}
            {chats.length === 0 && (
              <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                Чатів ще не створено
              </Typography>
            )}
          </List>
        )}
      </Paper>

      {/* Права панель з активним чатом */}
      <Paper sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selectedChat ? (
          <ChatWindow chat={selectedChat} onChatUpdate={fetchChats} />
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
            <Typography variant="h6">Оберіть чат для перегляду або створіть новий</Typography>
          </Box>
        )}
      </Paper>

      <CreateChatDialog 
        open={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onSuccess={fetchChats} 
      />
    </Box>
  );
};