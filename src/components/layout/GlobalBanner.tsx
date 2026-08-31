import { useEffect, useState } from 'react';
import { Alert, Box, Slide } from '@mui/material';
import { settingsApi, type SystemSettings } from '../../api/settingsApi';

export const GlobalBanner = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await settingsApi.getSettings();
        setSettings(data);
      } catch (error) {
        console.error('Failed to load global banner settings:', error);
      }
    };

    fetchSettings();
  }, []);

  if (!settings || !settings.globalBannerEnabled || !settings.globalBannerText) {
    return null;
  }

  const getSeverity = () => {
    switch (settings.globalBannerSeverity) {
      case 'CRITICAL':
        return 'error';
      case 'WARNING':
        return 'warning';
      case 'INFO':
      default:
        return 'info';
    }
  };

  return (
    <Slide direction="down" in={true} mountOnEnter unmountOnExit>
      <Box sx={{ mb: 2 }}>
        <Alert severity={getSeverity()} variant="filled" sx={{ borderRadius: 2 }}>
          {settings.globalBannerText}
        </Alert>
      </Box>
    </Slide>
  );
};