import { apiClient } from './apiClient';

export interface SystemSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  globalBannerEnabled: boolean;
  globalBannerText: string | null;
  globalBannerSeverity: 'INFO' | 'WARNING' | 'CRITICAL';
  maxPdfSizeMB: number;
  maxMediaSizeMB: number;
}

export type UpdateSettingsPayload = Partial<SystemSettings>;

export const settingsApi = {
  getSettings: async (): Promise<SystemSettings> => {
    const response = await apiClient.get<SystemSettings>('/settings');
    return response.data;
  },

  updateSettings: async (payload: UpdateSettingsPayload): Promise<SystemSettings> => {
    const response = await apiClient.patch<SystemSettings>('/settings', payload);
    return response.data;
  },
};