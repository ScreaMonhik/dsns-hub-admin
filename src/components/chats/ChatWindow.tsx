import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  Box, Typography, TextField, IconButton, Avatar, 
  CircularProgress, Paper, Tooltip 
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import PeopleIcon from '@mui/icons-material/People';
import { chatsApi, type ChatGroup, type ChatMessage } from '../../api/chatsApi';
import { useAuthStore } from '../../store/authStore';
import { SecureImage } from '../common/SecureImage';
import { ManageMembersDialog } from './ManageMembersDialog';
import { format } from 'date-fns';

interface Props {
  chat: ChatGroup;
  onChatUpdate: () => void;
}

export const ChatWindow = ({ chat, onChatUpdate }: Props) => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isManageMembersOpen, setIsManageMembersOpen] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Завантаження історії та підключення до WebSockets
  useEffect(() => {
    let isMounted = true;

    const initChat = async () => {
      setLoadingHistory(true);
      try {
        const history = await chatsApi.getMessages(chat.id, 1, 100);
        if (isMounted) setMessages(history.data.reverse()); // Старі повідомлення зверху
      } catch (error) {
        console.error('Failed to load history', error);
      } finally {
        if (isMounted) setLoadingHistory(false);
      }
    };

    initChat();

    const token = localStorage.getItem('jwt_token');
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    
    socketRef.current = io(`${baseUrl}/chat`, {
      auth: { token },
      transports: ['websocket']
    });

    socketRef.current.on('connect', () => {
      socketRef.current?.emit('joinRoom', { groupId: chat.id });
    });

    socketRef.current.on('newMessage', (msg: ChatMessage) => {
      if (isMounted && msg.groupId === chat.id) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      isMounted = false;
      socketRef.current?.disconnect();
    };
  }, [chat.id]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !socketRef.current) return;

    socketRef.current.emit('sendMessage', {
      groupId: chat.id,
      content: messageText.trim()
    });
    
    setMessageText('');
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      await chatsApi.uploadAvatar(chat.id, file);
      onChatUpdate(); // Оновлюємо список чатів зліва
    } catch (error) {
      console.error('Upload failed', error);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Заголовок чату */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box sx={{ position: 'relative' }}>
          <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}>
            {chat.avatarUrl ? (
              <SecureImage src={chat.avatarUrl} alt={chat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              chat.name.charAt(0)
            )}
          </Avatar>
          <IconButton 
            size="small" 
            sx={{ position: 'absolute', bottom: -8, right: -8, bgcolor: 'background.paper' }}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
          >
            {uploadingAvatar ? <CircularProgress size={16} /> : <PhotoCameraIcon fontSize="small" />}
          </IconButton>
          <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleAvatarUpload} />
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{chat.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            ID кімнати: {chat.id}
          </Typography>
        </Box>
        <Tooltip title="Управління учасниками">
          <IconButton color="primary" onClick={() => setIsManageMembersOpen(true)}>
            <PeopleIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Зона повідомлень */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, bgcolor: 'background.default', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {loadingHistory && <CircularProgress sx={{ alignSelf: 'center', mt: 2 }} />}
        
        {!loadingHistory && messages.map((msg) => {
          const isMe = msg.senderId === user?.id;
          return (
            <Box key={msg.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
              {!isMe && msg.sender && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1, mb: 0.5 }}>
                  {msg.sender.firstName} {msg.sender.lastName}
                </Typography>
              )}
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 1.5, 
                  maxWidth: '70%', 
                  bgcolor: isMe ? 'primary.main' : 'background.paper',
                  color: isMe ? 'primary.contrastText' : 'text.primary',
                  borderRadius: 2,
                  borderBottomRightRadius: isMe ? 0 : 8,
                  borderBottomLeftRadius: isMe ? 8 : 0,
                }}
              >
                <Typography variant="body2">{msg.content}</Typography>
              </Paper>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, mx: 1 }}>
                {format(new Date(msg.createdAt), 'HH:mm')}
              </Typography>
            </Box>
          );
        })}
        <div ref={messagesEndRef} />
      </Box>

      {/* Поле вводу */}
      <Box component="form" onSubmit={handleSendMessage} sx={{ p: 2, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Напишіть повідомлення..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          autoComplete="off"
        />
        <IconButton type="submit" color="primary" disabled={!messageText.trim()}>
          <SendIcon />
        </IconButton>
      </Box>

      <ManageMembersDialog 
        open={isManageMembersOpen}
        groupId={chat.id}
        chatName={chat.name}
        onClose={() => setIsManageMembersOpen(false)}
      />
    </Box>
  );
};