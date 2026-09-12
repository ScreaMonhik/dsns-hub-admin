import { useState } from 'react';
import { Box, Typography, IconButton, Divider, ToggleButton, ToggleButtonGroup } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import ThumbDownOffAltIcon from '@mui/icons-material/ThumbDownOffAlt';
import CommentOutlinedIcon from '@mui/icons-material/CommentOutlined';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useThemeStore } from '../../store/themeStore';
import { SecureImage } from '../common/SecureImage';
import { TipTapViewer } from './TipTapEditor';
import type { NewsStatus } from '../../api/newsApi';

interface NewsMobilePreviewProps {
  title: string;
  content: string;
  coverUrl?: string | null;
  categoryName?: string | null;
  publishedAt?: string | null;
  status?: NewsStatus;
  likes?: number;
  dislikes?: number;
  commentsCount?: number;
}

function previewPalette(isDark: boolean) {
  return {
    surface: isDark ? '#121212' : '#F8FAFC',
    onSurface: isDark ? '#F8FAFC' : '#0F172A',
    onVariant: isDark ? '#A1A1AA' : '#64748B',
    primary: isDark ? '#3B82F6' : '#1E40AF',
    primaryContainer: isDark ? 'rgba(29, 78, 216, 0.3)' : '#DBEAFE',
    onPrimaryContainer: isDark ? '#DBEAFE' : '#1E3A8A',
    divider: isDark ? '#333333' : 'rgba(15, 23, 42, 0.12)',
    inputFill: isDark ? 'rgba(44, 44, 44, 0.55)' : 'rgba(226, 232, 240, 0.7)',
    outline: isDark ? '#A1A1AA' : '#94A3B8',
    codeBg: isDark ? '#2C2C2C' : '#E2E8F0',
  };
}

export const NewsMobilePreview = ({
  title,
  content,
  coverUrl,
  categoryName,
  publishedAt,
  status,
  likes = 0,
  dislikes = 0,
  commentsCount = 0,
}: NewsMobilePreviewProps) => {
  const adminMode = useThemeStore((state) => state.mode);
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light');
  const isDark = previewMode === 'dark';
  const isAdminDark = adminMode === 'dark';
  const {
    surface,
    onSurface,
    onVariant,
    primary,
    primaryContainer,
    onPrimaryContainer,
    divider,
    inputFill,
    outline,
    codeBg,
  } = previewPalette(isDark);
  const panelMuted = isAdminDark ? '#A1A1AA' : '#64748B';

  const displayDate = publishedAt
    ? format(new Date(publishedAt), 'dd MMMM yyyy, HH:mm', { locale: uk })
    : format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: uk });

  return (
    <Box
      data-testid="news-mobile-preview"
      sx={{
        width: { xs: '100%', lg: '35%' },
        height: { lg: '100%' },
        minHeight: 0,
        bgcolor: isAdminDark ? '#0B1220' : '#E2E8F0',
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflow: 'hidden',
        gap: 2,
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 0.4, color: panelMuted, textTransform: 'uppercase', flexShrink: 0 }}>
        Прев’ю екрана в застосунку
      </Typography>

      <ToggleButtonGroup
        exclusive
        size="small"
        value={previewMode}
        onChange={(_, value: 'light' | 'dark' | null) => {
          if (value) setPreviewMode(value);
        }}
        aria-label="Тема прев’ю застосунку"
        data-testid="news-preview-theme-toggle"
        sx={{ flexShrink: 0 }}
      >
        <ToggleButton value="light" aria-label="Світла тема прев’ю">
          <LightModeIcon fontSize="small" sx={{ mr: 0.75 }} />
          Світла
        </ToggleButton>
        <ToggleButton value="dark" aria-label="Темна тема прев’ю">
          <DarkModeIcon fontSize="small" sx={{ mr: 0.75 }} />
          Темна
        </ToggleButton>
      </ToggleButtonGroup>

      {(status === 'DRAFT' || status === 'SCHEDULED') && (
        <Typography variant="caption" sx={{ color: status === 'DRAFT' ? 'warning.main' : 'info.main', fontWeight: 600 }}>
          {status === 'DRAFT' ? 'Чернетка — у застосунку ще не видно' : 'Заплановано — з’явиться після публікації'}
        </Typography>
      )}

      <Box
        data-testid="news-preview-phone"
        sx={{
          width: 360,
          height: 740,
          maxHeight: '100%',
          bgcolor: '#0F172A',
          borderRadius: '40px',
          border: '10px solid #0F172A',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          flex: '0 1 auto',
          minHeight: 0,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 120,
            height: 22,
            bgcolor: '#0F172A',
            borderBottomLeftRadius: 14,
            borderBottomRightRadius: 14,
            zIndex: 12,
          }}
        />

        <Box
          sx={{
            height: 36,
            px: 2.5,
            pt: 0.75,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: surface,
            color: onSurface,
            flexShrink: 0,
          }}
        >
          <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{format(new Date(), 'HH:mm')}</Typography>
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', opacity: 0.85 }}>
            <Box sx={{ width: 15, height: 9, bgcolor: onSurface, borderRadius: 0.4 }} />
            <Box sx={{ width: 13, height: 9, bgcolor: onSurface, borderRadius: 2 }} />
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 0.5,
            py: 0.5,
            bgcolor: surface,
            minHeight: 52,
            flexShrink: 0,
          }}
        >
          <IconButton size="small" disabled sx={{ color: `${onSurface} !important` }}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Typography
            sx={{
              flexGrow: 1,
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: '-1px',
              color: onSurface,
              lineHeight: 1.1,
            }}
          >
            Новина
          </Typography>
          <IconButton size="small" disabled sx={{ color: `${onSurface} !important` }}>
            <ShareOutlinedIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box
          data-testid="news-preview-scroll"
          data-preview-mode={previewMode}
          sx={{
            flex: '1 1 0',
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            bgcolor: surface,
            px: 2,
            py: 2,
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 2 }}>
            {categoryName ? (
              <Box
                sx={{
                  px: 1.25,
                  py: 0.5,
                  borderRadius: '8px',
                  bgcolor: primaryContainer,
                }}
              >
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: onPrimaryContainer, lineHeight: 1.2 }}>
                  {categoryName}
                </Typography>
              </Box>
            ) : (
              <Box />
            )}
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: onVariant, whiteSpace: 'nowrap' }}>
              {displayDate}
            </Typography>
          </Box>

          <Typography
            sx={{
              fontSize: 24,
              fontWeight: 700,
              lineHeight: 1.3,
              color: onSurface,
              wordBreak: 'break-word',
              mb: 3,
            }}
          >
            {title.trim() || 'Без назви'}
          </Typography>

          {coverUrl ? (
            <Box sx={{ mb: 3, borderRadius: '16px', overflow: 'hidden' }}>
              <SecureImage
                src={coverUrl}
                alt="Обкладинка"
                style={{ width: '100%', display: 'block' }}
              />
            </Box>
          ) : null}

          {content ? (
            <Box
              sx={{
                color: onSurface,
                '& .ProseMirror': {
                  fontSize: '16px',
                  lineHeight: 1.5,
                  color: onSurface,
                },
                '& p': { my: '6px' },
                '& h2, & h3': { mt: 2, mb: 1, fontWeight: 700, color: onSurface },
                '& img': { maxWidth: '100%', borderRadius: '12px', my: 2, display: 'block' },
                '& video': { maxWidth: '100%', borderRadius: '12px', my: 2, display: 'block' },
                '& hr': { my: 2, borderColor: divider },
                '& pre': {
                  bgcolor: codeBg,
                  borderRadius: '12px',
                  p: 1.5,
                  my: 1.5,
                  fontFamily: 'monospace',
                  fontSize: 14,
                  overflowX: 'auto',
                },
                '& [data-youtube-video]': {
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '16 / 9',
                  my: 1.5,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  '& iframe': {
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    display: 'block',
                  },
                },
                '& blockquote': {
                  borderLeft: `4px solid ${primary}`,
                  pl: 2,
                  my: 1.5,
                  mx: 0,
                  fontStyle: 'normal',
                },
                '& a': { color: primary, textDecoration: 'underline' },
                '& ul, & ol': { pl: 2.5, my: 1 },
              }}
            >
              <TipTapViewer value={content} />
            </Box>
          ) : (
            <Typography sx={{ fontSize: 16, lineHeight: 1.5, color: outline }}>Текст новини...</Typography>
          )}

          <Box sx={{ mt: 4, mb: 1 }}>
            <Divider sx={{ borderColor: divider }} />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 1 }}>
              <ThumbUpOffAltIcon sx={{ fontSize: 24, color: onVariant }} />
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: onVariant }}>{likes}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 1, ml: 1 }}>
              <ThumbDownOffAltIcon sx={{ fontSize: 24, color: onVariant }} />
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: onVariant }}>{dislikes}</Typography>
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <CommentOutlinedIcon sx={{ fontSize: 20, color: outline }} />
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: onVariant, ml: 1 }}>{commentsCount}</Typography>
          </Box>

          <Typography sx={{ mt: 3, mb: 2, fontSize: 22, fontWeight: 700, color: onSurface }}>
            Коментарі
          </Typography>
          <Typography sx={{ py: 4, textAlign: 'center', color: outline, fontSize: 14 }}>
            {commentsCount > 0
              ? `У застосунку тут будуть коментарі (${commentsCount})`
              : 'Немає коментарів. Будьте першим!'}
          </Typography>
        </Box>

        <Box
          sx={{
            bgcolor: surface,
            px: 2,
            py: 1.5,
            boxShadow: '0 -6px 16px rgba(0,0,0,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              flexGrow: 1,
              bgcolor: inputFill,
              borderRadius: '24px',
              px: 2,
              py: 1.25,
            }}
          >
            <Typography sx={{ fontSize: 14, color: outline }}>Написати коментар...</Typography>
          </Box>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <SendRoundedIcon sx={{ color: '#fff', fontSize: 18 }} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
