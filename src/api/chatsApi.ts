import { apiClient } from './apiClient';
import type { User } from '../store/authStore';

export interface ChatGroup {
  id: string;
  name: string;
  departmentId: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface GroupMember {
  id: string;
  userId: string;
  groupId: string;
  isAdmin: boolean;
  user: User;
}

export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  groupId: string;
  createdAt: string;
  isDeleted: boolean;
  sender?: User;
}

export interface CreateChatPayload {
  name: string;
  departmentId?: string | null;
  adminIds: string[];
}

export const chatsApi = {
  getAllGroups: async (departmentId?: string) => {
    const response = await apiClient.get<ChatGroup[]>('/chat/groups/all', { 
      params: { departmentId } 
    });
    return response.data;
  },

  createGroup: async (payload: CreateChatPayload) => {
    const response = await apiClient.post<ChatGroup>('/chat/groups', payload);
    return response.data;
  },

  uploadAvatar: async (groupId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<{ url: string }>(`/chat/groups/${groupId}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getMembers: async (groupId: string) => {
    const response = await apiClient.get<GroupMember[]>(`/chat/groups/${groupId}/members`);
    return response.data;
  },

  addMember: async (groupId: string, userId: string) => {
    const response = await apiClient.post<GroupMember>(`/chat/groups/${groupId}/members`, { userId });
    return response.data;
  },

  removeMember: async (groupId: string, userId: string) => {
    const response = await apiClient.delete(`/chat/groups/${groupId}/members/${userId}`);
    return response.data;
  },

  updateMemberRole: async (groupId: string, userId: string, isAdmin: boolean) => {
    const response = await apiClient.patch<GroupMember>(`/chat/groups/${groupId}/members/${userId}/role`, { isAdmin });
    return response.data;
  },

  getMessages: async (groupId: string, page = 1, limit = 50) => {
    const response = await apiClient.get<{ data: ChatMessage[], meta: any }>(`/chat/groups/${groupId}/messages`, { 
      params: { page, limit } 
    });
    return response.data;
  }
};