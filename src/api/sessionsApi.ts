import { apiClient } from './apiClient';

export interface UserSession {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}

export const sessionsApi = {
  // Власні сесії
  getMySessions: async (): Promise<UserSession[]> => {
    const response = await apiClient.get<UserSession[]>('/auth/sessions');
    return response.data;
  },

  revokeMySession: async (sessionId: string): Promise<void> => {
    await apiClient.delete(`/auth/sessions/${sessionId}`);
  },

  revokeAllOtherMySessions: async (): Promise<void> => {
    await apiClient.delete('/auth/sessions/other');
  },

  // Адмінські дії над сесіями користувачів
  getUserSessions: async (userId: string): Promise<UserSession[]> => {
    const response = await apiClient.get<UserSession[]>(`/users/${userId}/sessions`);
    return response.data;
  },

  revokeUserSession: async (userId: string, sessionId: string): Promise<void> => {
    await apiClient.delete(`/users/${userId}/sessions/${sessionId}`);
  },

  revokeAllUserSessions: async (userId: string): Promise<void> => {
    await apiClient.delete(`/users/${userId}/sessions`);
  },
};