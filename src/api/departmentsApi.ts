import { apiClient } from './apiClient';

export interface Department {
  id: string;
  name: string;
}

export const departmentsApi = {
  getDepartments: async (search?: string) => {
    const response = await apiClient.get<Department[]>('/departments', {
      params: search ? { search } : undefined,
    });
    return response.data;
  },
};