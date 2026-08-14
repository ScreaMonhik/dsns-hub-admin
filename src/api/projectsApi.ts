import { apiClient } from './apiClient';

export const ProjectStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type ProjectStatus = typeof ProjectStatus[keyof typeof ProjectStatus];

export const VoteType = {
  UPVOTE: 'UPVOTE',
  DOWNVOTE: 'DOWNVOTE',
} as const;

export type VoteType = typeof VoteType[keyof typeof VoteType];

export interface ProjectComment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  };
}

export interface ProjectModel {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  };
  departments: {
    id: string;
    name: string;
  }[];
  upvotes?: number;
  downvotes?: number;
  currentUserVote?: VoteType | null;
  comments?: ProjectComment[];
  _count?: {
    comments: number;
  };
}

export interface PaginatedProjectsResponse {
  data: ProjectModel[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
  };
}

export interface CreateProjectPayload {
  file: File;
  title: string;
  description: string;
  status?: ProjectStatus;
  departmentIds?: string[];
}

export interface UpdateProjectPayload {
  title?: string;
  description?: string;
  status?: ProjectStatus;
  departmentIds?: string[];
}

export const projectsApi = {
  getProjects: async (
    page: number = 1,
    limit: number = 10,
    departmentId?: string,
    status?: ProjectStatus,
    search?: string
  ) => {
    const params: Record<string, string | number> = { page, limit };
    if (departmentId) params.departmentId = departmentId;
    if (status) params.status = status;
    if (search) params.search = search;

    const response = await apiClient.get<PaginatedProjectsResponse>('/projects', { params });
    return response.data;
  },

  getProjectById: async (id: string) => {
    const response = await apiClient.get<ProjectModel>(`/projects/${id}`);
    return response.data;
  },

  createProject: async (payload: CreateProjectPayload) => {
    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('title', payload.title);
    formData.append('description', payload.description);
    if (payload.status) formData.append('status', payload.status);
    
    if (payload.departmentIds && payload.departmentIds.length > 0) {
      payload.departmentIds.forEach(id => formData.append('departmentIds', id));
    }

    const response = await apiClient.post<ProjectModel>('/projects', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updateProject: async (id: string, payload: UpdateProjectPayload) => {
    const response = await apiClient.patch<ProjectModel>(`/projects/${id}`, payload);
    return response.data;
  },

  updateProjectFile: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.patch<ProjectModel>(`/projects/${id}/file`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  downloadProjectFile: async (fileUrl: string): Promise<Blob> => {
    const response = await apiClient.get(fileUrl, { responseType: 'blob' });
    return response.data;
  },

  publishProject: async (id: string) => {
    const response = await apiClient.patch<{ id: string; status: ProjectStatus }>(`/projects/${id}/publish`);
    return response.data;
  },

  archiveProject: async (id: string) => {
    const response = await apiClient.patch<{ id: string; status: ProjectStatus }>(`/projects/${id}/archive`);
    return response.data;
  },

  unarchiveProject: async (id: string) => {
    const response = await apiClient.patch<{ id: string; status: ProjectStatus }>(`/projects/${id}/unarchive`);
    return response.data;
  },

  deleteProject: async (id: string) => {
    const response = await apiClient.delete<{ message: string }>(`/projects/${id}`);
    return response.data;
  },

  addComment: async (id: string, content: string) => {
    const response = await apiClient.post<ProjectComment>(`/projects/${id}/comments`, { content });
    return response.data;
  },

  voteProject: async (id: string, voteType: VoteType) => {
    const response = await apiClient.post<{ message: string }>(`/projects/${id}/vote`, { voteType });
    return response.data;
  }
};