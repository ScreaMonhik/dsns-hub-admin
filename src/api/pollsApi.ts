import { apiClient } from './apiClient';
import type { Department } from './departmentsApi';

export const PollStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type PollStatus = typeof PollStatus[keyof typeof PollStatus];

export interface PollAuthor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string | null;
}

export interface PollOption {
  id: string;
  text: string;
  pollId: string;
  _count: {
    votes: number;
  };
}

export interface Poll {
  id: string;
  title: string;
  description?: string | null;
  status: PollStatus;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string | null;
  archivedVisibleUntil?: string | null;
  author?: PollAuthor | null;
  departments: Department[];
  options: PollOption[];
  totalVotes: number;
}

export interface PaginatedPollsResponse {
  data: Poll[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
  };
}

export interface CreatePollDto {
  title: string;
  description?: string;
  status?: PollStatus;
  expiresAt?: string | null; // Дата завершення
  departmentIds?: string[];
  options: string[];
}

export interface UpdatePollDto extends Partial<CreatePollDto> {}

export const pollsApi = {
  getPolls: async (
    page: number = 1,
    limit: number = 10,
    departmentId?: string,
    status?: PollStatus,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ) => {
    const params: Record<string, any> = { page, limit };
    if (departmentId) params.departmentId = departmentId;
    if (status) params.status = status;
    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.sortOrder = sortOrder;

    const response = await apiClient.get<PaginatedPollsResponse>('/polls', { params });
    return response.data;
  },

  createPoll: async (payload: CreatePollDto) => {
    const response = await apiClient.post<Poll>('/polls', payload);
    return response.data;
  },

  updatePoll: async (id: string, payload: UpdatePollDto) => {
    const response = await apiClient.patch<Poll>(`/polls/${id}`, payload);
    return response.data;
  },

  deletePoll: async (id: string) => {
    const response = await apiClient.delete(`/polls/${id}`);
    return response.data;
  },

  updateVisibility: async (id: string, extendDays: number) => {
    const response = await apiClient.patch<Poll>(`/polls/${id}/visibility`, { extendDays });
    return response.data;
  },
};