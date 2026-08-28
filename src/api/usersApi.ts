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

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  role?: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
  isActive?: boolean;
}

export const usersApi = {
  getUsers: async (page: number = 1, limit: number = 10, search?: string) => {
    const response = await apiClient.get<UsersResponse>(`/users`, {
      params: { page, limit, search: search || undefined },
    });
    return response.data;
  },
  
  createUser: async (payload: CreateUserPayload) => {
    const response = await apiClient.post<User>('/auth/register', payload);
    return response.data;
  },

  updateUser: async (id: string, payload: UpdateUserPayload) => {
    const response = await apiClient.patch<User>(`/users/${id}`, payload);
    return response.data;
  },

  changeMyPassword: async (payload: { oldPassword: string; newPassword: string }) => {
    const response = await apiClient.patch('/users/me/password', payload);
    return response.data;
  },

  uploadMyAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.patch<{ avatarUrl: string }>('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  resetPassword: async (id: string, newPassword: string) => {
    const response = await apiClient.post(`/users/${id}/reset-password`, { newPassword });
    return response.data;
  },

  deleteUser: async (id: string) => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  }
};