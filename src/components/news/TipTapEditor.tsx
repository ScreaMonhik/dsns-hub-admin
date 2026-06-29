import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { Box, IconButton, Toolbar, Tooltip, CircularProgress, Divider } from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatStrikethroughIcon from '@mui/icons-material/FormatStrikethrough';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatAlignJustifyIcon from '@mui/icons-material/FormatAlignJustify';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import ImageIcon from '@mui/icons-material/Image';
import TitleIcon from '@mui/icons-material/Title';
import { useState, useRef, useEffect } from 'react';
import { newsApi } from '../../api/newsApi';
import { getFullUrl } from '../../utils/url';

interface TipTapEditorProps {
  value: string;
  onChange: (content: string) => void;
  error?: boolean;
}

export const TipTapEditor = ({ value, onChange, error }: TipTapEditorProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Image,
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: 'Введіть текст новини тут...',
      }),
    ],
    content: (() => {
      try {
        return value ? JSON.parse(value) : '';
      } catch {
        return value; // Резервний варіант, якщо в базі зашився старий чистий HTML
      }
    })(),
    onUpdate: ({ editor }) => {
      // Експортуємо контент як валідний JSON рядок для збереження в TEXT поле бази даних
      const jsonString = JSON.stringify(editor.getJSON());
      onChange(jsonString);
    },
  });

  // Забезпечуємо синхронізацію при завантаженні існуючої новини з сервера
  useEffect(() => {
    if (editor) {
      const currentHTML = editor.getHTML();
      const currentJSON = JSON.stringify(editor.getJSON());
      
      if (value !== currentHTML && value !== currentJSON) {
        try {
          editor.commands.setContent(JSON.parse(value));
        } catch {
          editor.commands.setContent(value);
        }
      }
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

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Введіть URL посилання:', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <Box sx={{ 
      border: 1, 
      borderColor: error ? 'error.main' : 'divider', 
      borderRadius: 1,
      overflow: 'hidden',
      bgcolor: 'background.paper'
    }}>
      <Toolbar variant="dense" sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default', gap: 0.5, flexWrap: 'wrap', py: 0.5 }}>
        {/* Заголовки */}
        <Tooltip title="Заголовок H2">
          <IconButton size="small" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} color={editor.isActive('heading', { level: 2 }) ? 'primary' : 'default'}>
            <TitleIcon fontSize="small" />
            <Box component="span" sx={{ fontSize: '10px', ml: -0.5, fontWeight: 'bold' }}>2</Box>
          </IconButton>
        </Tooltip>
        <Tooltip title="Заголовок H3">
          <IconButton size="small" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} color={editor.isActive('heading', { level: 3 }) ? 'primary' : 'default'}>
            <TitleIcon fontSize="small" />
            <Box component="span" sx={{ fontSize: '10px', ml: -0.5, fontWeight: 'bold' }}>3</Box>
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Форматування тексту */}
        <Tooltip title="Жирний">
          <IconButton size="small" onClick={() => editor.chain().focus().toggleBold().run()} color={editor.isActive('bold') ? 'primary' : 'default'}>
            <FormatBoldIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Курсив">
          <IconButton size="small" onClick={() => editor.chain().focus().toggleItalic().run()} color={editor.isActive('italic') ? 'primary' : 'default'}>
            <FormatItalicIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Підкреслений">
          <IconButton size="small" onClick={() => editor.chain().focus().toggleUnderline().run()} color={editor.isActive('underline') ? 'primary' : 'default'}>
            <FormatUnderlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Закреслений">
          <IconButton size="small" onClick={() => editor.chain().focus().toggleStrike().run()} color={editor.isActive('strike') ? 'primary' : 'default'}>
            <FormatStrikethroughIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Вирівнювання тексту */}
        <Tooltip title="Вирівняти ліворуч">
          <IconButton size="small" onClick={() => editor.chain().focus().setTextAlign('left').run()} color={editor.isActive({ textAlign: 'left' }) ? 'primary' : 'default'}>
            <FormatAlignLeftIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="По центру">
          <IconButton size="small" onClick={() => editor.chain().focus().setTextAlign('center').run()} color={editor.isActive({ textAlign: 'center' }) ? 'primary' : 'default'}>
            <FormatAlignCenterIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Вирівняти праворуч">
          <IconButton size="small" onClick={() => editor.chain().focus().setTextAlign('right').run()} color={editor.isActive({ textAlign: 'right' }) ? 'primary' : 'default'}>
            <FormatAlignRightIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="По ширині">
          <IconButton size="small" onClick={() => editor.chain().focus().setTextAlign('justify').run()} color={editor.isActive({ textAlign: 'justify' }) ? 'primary' : 'default'}>
            <FormatAlignJustifyIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Списки та цитати */}
        <Tooltip title="Маркований список">
          <IconButton size="small" onClick={() => editor.chain().focus().toggleBulletList().run()} color={editor.isActive('bulletList') ? 'primary' : 'default'}>
            <FormatListBulletedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Нумерований список">
          <IconButton size="small" onClick={() => editor.chain().focus().toggleOrderedList().run()} color={editor.isActive('orderedList') ? 'primary' : 'default'}>
            <FormatListNumberedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Блок цитати">
          <IconButton size="small" onClick={() => editor.chain().focus().toggleBlockquote().run()} color={editor.isActive('blockquote') ? 'primary' : 'default'}>
            <FormatQuoteIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Посилання та Медіа */}
        <Tooltip title="Додати посилання">
          <IconButton size="small" onClick={setLink} color={editor.isActive('link') ? 'primary' : 'default'}>
            <LinkIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Видалити посилання">
          <IconButton size="small" onClick={() => editor.chain().focus().unsetLink().run()} disabled={!editor.isActive('link')}>
            <LinkOffIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Tooltip title="Вставити зображення">
          <IconButton size="small" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            {isUploading ? <CircularProgress size={20} /> : <ImageIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
        <input type="file" hidden ref={fileInputRef} accept="image/jpeg, image/png" onChange={handleImageUpload} />
      </Toolbar>
      
      <Box sx={{ 
        p: 2, 
        minHeight: '320px', 
        maxHeight: '500px',
        overflowY: 'auto',
        '& .ProseMirror': { 
          outline: 'none',
          minHeight: '300px',
          fontFamily: 'inherit',
          fontSize: '1rem',
          lineHeight: 1.5,
        },
        '& .ProseMirror p.is-editor-empty:first-of-type::before': {
          content: 'attr(data-placeholder)',
          float: 'left',
          color: 'text.disabled',
          pointerEvents: 'none',
          height: 0,
        },
        '& img': { 
          maxWidth: '100%', 
          height: 'auto', 
          borderRadius: 1, 
          display: 'block', 
          my: 2 
        },
        '& blockquote': {
          borderLeft: '4px solid',
          borderColor: 'primary.main',
          pl: 2,
          mx: 0,
          my: 2,
          fontStyle: 'italic',
          color: 'text.secondary',
        },
        '& a': {
          color: 'primary.main',
          textDecoration: 'underline',
        }
      }}>
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
};