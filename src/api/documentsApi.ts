import { apiClient } from './apiClient';

export const DocumentStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type DocumentStatus = typeof DocumentStatus[keyof typeof DocumentStatus];

export interface DocumentModel {
  id: string;
  title: string;
  description?: string | null;
  fileUrl: string;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
  authorId?: string | null;
  author?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  };
  departments: {
    id: string;
    name: string;
  }[];
}

export interface PaginatedDocumentsResponse {
  data: DocumentModel[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
  };
}

export interface CreateDocumentPayload {
  file: File;
  title: string;
  description?: string;
  status?: DocumentStatus;
  departmentIds?: string[];
}

export interface UpdateDocumentPayload {
  title?: string;
  description?: string;
  status?: DocumentStatus;
  departmentIds?: string[];
}

export const documentsApi = {
  getDocumentById: async (id: string) => {
    const response = await apiClient.get<DocumentModel>(`/documents/${id}`);
    return response.data;
  },

  getDocuments: async (
    page: number = 1,
    limit: number = 10,
    departmentId?: string,
    status?: DocumentStatus,
    search?: string
  ) => {
    const params: Record<string, string | number> = { page, limit };
    if (departmentId) params.departmentId = departmentId;
    if (status) params.status = status;
    if (search) params.search = search;

    const response = await apiClient.get<PaginatedDocumentsResponse>('/documents', { params });
    return response.data;
  },

  createDocument: async (payload: CreateDocumentPayload) => {
    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('title', payload.title);
    if (payload.description) formData.append('description', payload.description);
    if (payload.status) formData.append('status', payload.status);
    
    if (payload.departmentIds && payload.departmentIds.length > 0) {
      payload.departmentIds.forEach(id => formData.append('departmentIds', id));
    }

    const response = await apiClient.post<DocumentModel>('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updateDocument: async (id: string, payload: UpdateDocumentPayload) => {
    const response = await apiClient.patch<DocumentModel>(`/documents/${id}`, payload);
    return response.data;
  },

  updateDocumentFile: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.patch<DocumentModel>(`/documents/${id}/file`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  publishDocument: async (id: string) => {
    const response = await apiClient.patch<{ id: string; status: DocumentStatus }>(`/documents/${id}/publish`);
    return response.data;
  },

  archiveDocument: async (id: string) => {
    const response = await apiClient.patch<{ id: string; status: DocumentStatus }>(`/documents/${id}/archive`);
    return response.data;
  },

  unarchiveDocument: async (id: string) => {
    const response = await apiClient.patch<{ id: string; status: DocumentStatus }>(`/documents/${id}/unarchive`);
    return response.data;
  },

  deleteDocument: async (id: string) => {
    const response = await apiClient.delete<{ message: string }>(`/documents/${id}`);
    return response.data;
  },

  downloadDocument: async (fileUrl: string): Promise<Blob> => {
    const response = await apiClient.get(fileUrl, { responseType: 'blob' });
    return response.data;
  }
};