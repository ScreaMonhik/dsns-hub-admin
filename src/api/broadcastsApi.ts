import { apiClient } from './apiClient';

export type BroadcastSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type SoundPreset = 'DEFAULT' | 'SIREN' | 'ALERT';
export type BroadcastStatus = 'SENT' | 'FAILED' | 'PENDING';

export interface EmergencyBroadcast {
  id: string;
  title: string;
  body: string;
  severity: BroadcastSeverity;
  soundPreset: SoundPreset;
  status: BroadcastStatus;
  recipientCount: number;
  createdAt: string;
  authorId: string;
  author?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  departments?: {
    id: string;
    name: string;
  }[];
}

export interface PaginatedBroadcastsResponse {
  data: EmergencyBroadcast[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
  };
}

export interface CreateBroadcastPayload {
  title: string;
  body: string;
  severity: BroadcastSeverity;
  soundPreset: SoundPreset;
  departmentIds?: string[];
}

export const broadcastsApi = {
  getBroadcasts: async (
    page: number = 1,
    limit: number = 10,
    severity?: BroadcastSeverity | '',
    search?: string
  ) => {
    const params: Record<string, string | number> = { page, limit };
    if (severity) params.severity = severity;
    if (search) params.search = search;

    const response = await apiClient.get<PaginatedBroadcastsResponse>('/emergency-broadcasts', { params });
    return response.data;
  },

  getBroadcastById: async (id: string) => {
    const response = await apiClient.get<EmergencyBroadcast>(`/emergency-broadcasts/${id}`);
    return response.data;
  },

  sendBroadcast: async (payload: CreateBroadcastPayload) => {
    const response = await apiClient.post<EmergencyBroadcast>('/emergency-broadcasts', payload);
    return response.data;
  },
};