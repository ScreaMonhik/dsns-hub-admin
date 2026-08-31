import { apiClient } from './apiClient';

export interface Department {
  id: string;
  name: string;
  parentId?: string | null;
  orderIndex: number;
  hasChildren: boolean;
}

export interface PaginatedDepartmentsResponse {
  data: Department[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
  };
}

export interface CreateDepartmentPayload {
  name: string;
  parentId?: string | null;
}

export interface UpdateDepartmentPayload {
  name?: string;
  parentId?: string | null;
}

export interface ReorderDepartmentPayload {
  id: string;
  parentId: string | null;
  orderIndex: number;
}

export const departmentsApi = {
  getDepartments: async (page: number = 1, limit: number = 20, search?: string) => {
    const params: Record<string, string | number> = { page, limit };
    if (search) params.search = search;

    const response = await apiClient.get<PaginatedDepartmentsResponse>('/departments', { params });
    return response.data;
  },

  getAllDepartments: async () => {
    const response = await apiClient.get<Department[]>('/departments/all');
    return response.data;
  },

  createDepartment: async (payload: CreateDepartmentPayload) => {
    const response = await apiClient.post<Department>('/departments', payload);
    return response.data;
  },

  updateDepartment: async (id: string, payload: UpdateDepartmentPayload) => {
    const response = await apiClient.patch<Department>(`/departments/${id}`, payload);
    return response.data;
  },

  deleteDepartment: async (id: string) => {
    const response = await apiClient.delete<{ message: string }>(`/departments/${id}`);
    return response.data;
  },

  reorderDepartments: async (items: ReorderDepartmentPayload[]) => {
    const response = await apiClient.patch<{ message: string }>('/departments/reorder', { items });
    return response.data;
  },

  exportDepartmentsJson: async (): Promise<void> => {
    const response = await apiClient.get('/departments/export-json', {
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `departments_structure_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};