import { apiClient } from './apiClient';
import type { User } from '../store/authStore';

export interface UsersResponse {
  data: User[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
  };
}

export type CreateUserPayload = Omit<User, 'id' | 'createdAt' | 'avatarUrl'> & { password: string };

export const usersApi = {
  getUsers: async (page: number = 1, limit: number = 10) => {
    const response = await apiClient.get<UsersResponse>(`/users`, {
      params: { page, limit },
    });
    return response.data;
  },
  
  createUser: async (payload: CreateUserPayload) => {
    const response = await apiClient.post<User>('/auth/register', payload);
    return response.data;
  },
};