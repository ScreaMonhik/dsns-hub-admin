import { apiClient } from './apiClient';

export interface Department {
  id: string;
  name: string;
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

export const departmentsApi = {
  getDepartments: async (page: number = 1, limit: number = 20, search?: string) => {
    const params: Record<string, string | number> = { page, limit };
    if (search) params.search = search;

    const response = await apiClient.get<PaginatedDepartmentsResponse>('/departments', { params });
    return response.data;
  },
};