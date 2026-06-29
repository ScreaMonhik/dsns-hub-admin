import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Box, IconButton, Toolbar, Tooltip, CircularProgress } from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import ImageIcon from '@mui/icons-material/Image';
import { useState, useRef, useEffect } from 'react';
import { newsApi } from '../../api/newsApi';

interface TipTapEditorProps {
  value: string;
  onChange: (content: string) => void;
  error?: boolean;
}

const getFullUrl = (path: string) => 
  path.startsWith('http') ? path : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${path}`;

export const TipTapEditor = ({ value, onChange, error }: TipTapEditorProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Синхронізація зовнішнього value (наприклад, при завантаженні для редагування)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) return null;

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const res = await newsApi.uploadMedia(file);
      editor.chain().focus().setImage({ src: getFullUrl(res.url) }).run();
    } catch (err) {
      console.error('Failed to upload image:', err);
      alert('Помилка завантаження зображення');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Box sx={{ 
      border: 1, 
      borderColor: error ? 'error.main' : 'divider', 
      borderRadius: 1,
      overflow: 'hidden'
    }}>
      <Toolbar variant="dense" sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default', gap: 1 }}>
        <IconButton size="small" onClick={() => editor.chain().focus().toggleBold().run()} color={editor.isActive('bold') ? 'primary' : 'default'}>
          <FormatBoldIcon />
        </IconButton>
        <IconButton size="small" onClick={() => editor.chain().focus().toggleItalic().run()} color={editor.isActive('italic') ? 'primary' : 'default'}>
          <FormatItalicIcon />
        </IconButton>
        <IconButton size="small" onClick={() => editor.chain().focus().toggleBulletList().run()} color={editor.isActive('bulletList') ? 'primary' : 'default'}>
          <FormatListBulletedIcon />
        </IconButton>
        <IconButton size="small" onClick={() => editor.chain().focus().toggleOrderedList().run()} color={editor.isActive('orderedList') ? 'primary' : 'default'}>
          <FormatListNumberedIcon />
        </IconButton>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Tooltip title="Вставити зображення">
          <IconButton size="small" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            {isUploading ? <CircularProgress size={24} /> : <ImageIcon />}
          </IconButton>
        </Tooltip>
        <input type="file" hidden ref={fileInputRef} accept="image/jpeg, image/png" onChange={handleImageUpload} />
      </Toolbar>
      
      <Box sx={{ 
        p: 2, 
        minHeight: '300px', 
        maxHeight: '500px',
        overflowY: 'auto',
        '& .ProseMirror': { outline: 'none' },
        '& img': { maxWidth: '100%', height: 'auto', borderRadius: 1 }
      }}>
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
};