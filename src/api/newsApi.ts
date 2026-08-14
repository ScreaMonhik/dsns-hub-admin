import { apiClient } from './apiClient';

export type NewsStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface NewsCategory {
  id: string;
  name: string;
}

export interface News {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  status: NewsStatus;
  categoryId: string | null;
  category: NewsCategory | null;
  departments?: { id: string; name: string }[];
  createdAt: string;
  authorId: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  _count?: {
    comments: number;
    likes: number;
    dislikes: number;
  };
}

export interface NewsComment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

export interface NewsListResponse {
  data: News[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
  };
}

export type NewsPayload = {
  title: string;
  content: string;
  imageUrl: string | null;
  status: NewsStatus;
  categoryId: string | null;
  departmentIds?: string[];
};

export const newsApi = {
  getNews: async (
    page: number = 1, 
    limit: number = 10, 
    categoryId?: string, 
    departmentId?: string,
    status?: NewsStatus,
    sortBy?: string,
    sortOrder?: 'ASC' | 'DESC'
  ) => {
    const params: Record<string, any> = { page, limit };
    if (categoryId) params.categoryId = categoryId;
    if (departmentId) params.departmentId = departmentId;
    if (status) params.status = status;
    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.sortOrder = sortOrder;
    
    const response = await apiClient.get<NewsListResponse>('/news', { params });
    return response.data;
  },

  getCategories: async () => {
    const response = await apiClient.get<NewsCategory[]>('/news/categories');
    return response.data;
  },

  createCategory: async (name: string) => {
    const response = await apiClient.post<NewsCategory>('/news/categories', { name });
    return response.data;
  },

  deleteCategory: async (id: string) => {
    const response = await apiClient.delete(`/news/categories/${id}`);
    return response.data;
  },

  updateCategory: async (id: string, name: string) => {
    const response = await apiClient.patch<NewsCategory>(`/news/categories/${id}`, { name });
    return response.data;
  },

  reorderCategories: async (categoryIds: string[]) => {
    const response = await apiClient.patch(`/news/categories/reorder`, { categoryIds });
    return response.data;
  },

  createNews: async (payload: NewsPayload) => {
    const response = await apiClient.post<News>('/news', payload);
    return response.data;
  },

  updateNews: async (id: string, payload: Partial<NewsPayload>) => {
    const response = await apiClient.patch<News>(`/news/${id}`, payload);
    return response.data;
  },

  deleteNews: async (id: string) => {
    const response = await apiClient.delete(`/news/${id}`);
    return response.data;
  },

  uploadMedia: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<{ url: string }>('/news/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getNewsComments: async (newsId: string) => {
    const response = await apiClient.get<NewsComment[]>(`/news/${newsId}/comments`);
    return response.data;
  },

  addNewsComment: async (newsId: string, content: string) => {
    const response = await apiClient.post<NewsComment>(`/news/${newsId}/comments`, { content });
    return response.data;
  },

  deleteNewsComment: async (newsId: string, commentId: string) => {
    const response = await apiClient.delete(`/news/${newsId}/comments/${commentId}`);
    return response.data;
  },
};