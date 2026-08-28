import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Youtube from '@tiptap/extension-youtube';
import { Node, mergeAttributes } from '@tiptap/core';
import { 
  Box, IconButton, Toolbar, Tooltip, CircularProgress, Divider, 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField 
} from '@mui/material';
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
import YouTubeIcon from '@mui/icons-material/YouTube';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import TitleIcon from '@mui/icons-material/Title';
import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { newsApi } from '../../api/newsApi';
import { SecureImage } from '../common/SecureImage';
import { getFullUrl } from '../../utils/url';

// Кастомний вузол для TipTap: рендерить наш SecureImage
const TipTapSecureImage = (props: any) => {
  return (
    <NodeViewWrapper as="div" style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '16px 0' }}>
      <SecureImage
        src={props.node.attrs.src}
        alt={props.node.attrs.alt || 'Зображення новини'}
        style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }}
      />
    </NodeViewWrapper>
  );
};

const SecureImageExtension = Image.extend({
  addNodeView() {
    return ReactNodeViewRenderer(TipTapSecureImage);
  },
});

// Кастомний вузол для TipTap: рендерить власні відео
const TipTapVideo = (props: any) => {
  // Для відео формуємо повний URL. Якщо потрібен JWT, бекенд повинен роздавати відео з перевіркою cookies 
  // або використовувати тимчасові підписані посилання, оскільки стандартний <video> тег не вміє передавати Authorization Headers.
  const videoUrl = getFullUrl(props.node.attrs.src);
  return (
    <NodeViewWrapper as="div" style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '16px 0' }}>
      <video controls src={videoUrl} style={{ maxWidth: '100%', borderRadius: '4px', maxHeight: '450px' }} />
    </NodeViewWrapper>
  );
};

const VideoExtension = Node.create({
  name: 'video',
  group: 'block',
  atom: true,
  addAttributes() {
    return { src: { default: null } };
  },
  parseHTML() {
    return [{ tag: 'video[src]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes(HTMLAttributes, { controls: 'true', style: 'max-width: 100%; border-radius: 4px;' })];
  },
  addNodeView() {
    return ReactNodeViewRenderer(TipTapVideo);
  },
});

interface TipTapEditorProps {
  value: string;
  onChange: (content: string) => void;
  error?: boolean;
}

export const TipTapEditor = ({ value, onChange, error }: TipTapEditorProps) => {
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [linkDialog, setLinkDialog] = useState({ open: false, url: '' });
  const [youtubeDialog, setYoutubeDialog] = useState({ open: false, url: '' });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      SecureImageExtension,
      VideoExtension,
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
      }),
      Youtube.configure({
        inline: false,
        width: 640,
        height: 360,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: 'Введіть текст новини тут...',
      }),
    ],
    content: (() => {
      if (!value) return '';
      try {
        return typeof value === 'string' ? JSON.parse(value) : value;
      } catch {
        return value;
      }
    })(),
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()));
    },
  });

  useEffect(() => {
    if (!editor || value === undefined) return;

    let isJson = false;
    let parsedValue: any = value;

    if (typeof value === 'string') {
      try {
        parsedValue = JSON.parse(value);
        isJson = true;
      } catch {
        isJson = false;
      }
    } else if (typeof value === 'object') {
      isJson = true;
      parsedValue = value;
    }

    const currentJSON = JSON.stringify(editor.getJSON());
    const compareValue = isJson ? JSON.stringify(parsedValue) : value;

    if (compareValue !== currentJSON && value !== editor.getHTML()) {
      if (isJson) {
        try {
          editor.commands.setContent(parsedValue);
        } catch (error) {
          console.error('Failed to set JSON content in TipTap:', error);
        }
      } else {
        editor.commands.setContent(value || '');
      }
    }
  }, [value, editor]);

  if (!editor) return null;

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setIsImageUploading(true);
      const res = await newsApi.uploadMedia(file);
      editor.chain().focus().setImage({ src: res.url }).run();
    } catch (err) {
      console.error('Failed to upload image:', err);
      toast.error('Помилка завантаження зображення');
    } finally {
      setIsImageUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setIsVideoUploading(true);
      const res = await newsApi.uploadMedia(file);
      editor.chain().focus().insertContent({
        type: 'video',
        attrs: { src: res.url }
      }).run();
    } catch (err) {
      console.error('Failed to upload video:', err);
      toast.error('Помилка завантаження відео. Можливо перевищено ліміт розміру файлу.');
    } finally {
      setIsVideoUploading(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const openLinkDialog = () => {
    const previousUrl = editor.getAttributes('link').href;
    setLinkDialog({ open: true, url: previousUrl || '' });
  };

  const confirmLink = () => {
    if (!linkDialog.url) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkDialog.url }).run();
    }
    setLinkDialog({ open: false, url: '' });
  };

  const confirmYouTube = () => {
    if (youtubeDialog.url) {
      editor.chain().focus().setYoutubeVideo({ src: youtubeDialog.url }).run();
    }
    setYoutubeDialog({ open: false, url: '' });
  };

  return (
    <>
      <Box sx={{ 
        border: 1, 
        borderColor: error ? 'error.main' : 'divider',
        borderRadius: 1,
        overflow: 'hidden',
        bgcolor: 'background.paper'
      }}>
        <Toolbar variant="dense" sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default', gap: 0.5, flexWrap: 'wrap', py: 0.5 }}>
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

          <Tooltip title="Додати посилання">
            <IconButton size="small" onClick={openLinkDialog} color={editor.isActive('link') ? 'primary' : 'default'}>
              <LinkIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Видалити посилання">
            <IconButton size="small" onClick={() => editor.chain().focus().unsetLink().run()} disabled={!editor.isActive('link')}>
              <LinkOffIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Box sx={{ flexGrow: 1 }} />

          <Tooltip title="Вставити YouTube відео">
            <IconButton size="small" onClick={() => setYoutubeDialog({ open: true, url: '' })}>
              <YouTubeIcon fontSize="small" color="error" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Вставити відео з комп'ютера">
            <IconButton size="small" onClick={() => videoInputRef.current?.click()} disabled={isVideoUploading}>
              {isVideoUploading ? <CircularProgress size={20} /> : <OndemandVideoIcon fontSize="small" color="primary" />}
            </IconButton>
          </Tooltip>
          <input type="file" hidden ref={videoInputRef} accept="video/mp4, video/webm, video/ogg" onChange={handleVideoUpload} />
          
          <Tooltip title="Вставити зображення">
            <IconButton size="small" onClick={() => imageInputRef.current?.click()} disabled={isImageUploading}>
              {isImageUploading ? <CircularProgress size={20} /> : <ImageIcon fontSize="small" color="success" />}
            </IconButton>
          </Tooltip>
          <input type="file" hidden ref={imageInputRef} accept="image/jpeg, image/png, image/webp" onChange={handleImageUpload} />
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
          },
          '& iframe': {
            border: 'none',
            borderRadius: '8px',
            maxWidth: '100%',
          }
        }}>
          <EditorContent editor={editor} />
        </Box>
      </Box>

      {/* Діалог для посилання */}
      <Dialog open={linkDialog.open} onClose={() => setLinkDialog({ open: false, url: '' })} maxWidth="xs" fullWidth>
        <DialogTitle>Вставити посилання</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="URL адреса"
            type="url"
            fullWidth
            variant="outlined"
            value={linkDialog.url}
            onChange={(e) => setLinkDialog({ ...linkDialog, url: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && confirmLink()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkDialog({ open: false, url: '' })}>Скасувати</Button>
          <Button onClick={confirmLink} variant="contained">Застосувати</Button>
        </DialogActions>
      </Dialog>

      {/* Діалог для YouTube */}
      <Dialog open={youtubeDialog.open} onClose={() => setYoutubeDialog({ open: false, url: '' })} maxWidth="xs" fullWidth>
        <DialogTitle>Вставити відео з YouTube</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Посилання на YouTube"
            type="url"
            fullWidth
            variant="outlined"
            placeholder="https://www.youtube.com/watch?v=..."
            value={youtubeDialog.url}
            onChange={(e) => setYoutubeDialog({ ...youtubeDialog, url: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && confirmYouTube()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setYoutubeDialog({ open: false, url: '' })}>Скасувати</Button>
          <Button onClick={confirmYouTube} variant="contained" color="error">Вставити відео</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// Компонент для безпечного відображення контенту (Read-Only)
export const TipTapViewer = ({ value }: { value: string }) => {
  const editor = useEditor({
    editable: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      SecureImageExtension,
      VideoExtension,
      Underline,
      Link.configure({ openOnClick: true, autolink: true, defaultProtocol: 'https' }),
      Youtube.configure({ inline: false, width: 640, height: 360 }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: (() => {
      if (!value) return '';
      try {
        return typeof value === 'string' ? JSON.parse(value) : value;
      } catch {
        return value;
      }
    })(),
  });

  useEffect(() => {
    if (!editor || value === undefined) return;

    let isJson = false;
    let parsedValue: any = value;

    if (typeof value === 'string') {
      try {
        parsedValue = JSON.parse(value);
        isJson = true;
      } catch {
        isJson = false;
      }
    } else if (typeof value === 'object') {
      isJson = true;
      parsedValue = value;
    }

    const currentJSON = JSON.stringify(editor.getJSON());
    const compareValue = isJson ? JSON.stringify(parsedValue) : value;

    if (compareValue !== currentJSON && value !== editor.getHTML()) {
      if (isJson) {
        try {
          editor.commands.setContent(parsedValue);
        } catch (error) {
          console.error('Failed to set JSON content in TipTapViewer:', error);
        }
      } else {
        editor.commands.setContent(value || '');
      }
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <Box sx={{
      '& .ProseMirror': { 
        outline: 'none',
        fontFamily: 'inherit',
        fontSize: '1rem',
        lineHeight: 1.5,
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
      },
      '& iframe': {
        border: 'none',
        borderRadius: '8px',
        maxWidth: '100%',
      }
    }}>
      <EditorContent editor={editor} />
    </Box>
  );
};