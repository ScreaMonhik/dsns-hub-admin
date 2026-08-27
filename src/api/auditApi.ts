import { apiClient } from './apiClient';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT';
export type AuditResource = 'USER' | 'NEWS' | 'PROJECT' | 'DOCUMENT' | 'POLL' | 'CHAT' | 'SYSTEM';

export interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  resource: AuditResource;
  details: Record<string, any> | string | null;
  ipAddress: string | null;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface PaginatedAuditLogsResponse {
  data: AuditLog[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
  };
}

export const auditApi = {
  getLogs: async (
    page: number = 1,
    limit: number = 15,
    action?: string,
    resource?: string,
    startDate?: string,
    endDate?: string
  ) => {
    const params: Record<string, string | number> = { page, limit };
    if (action) params.action = action;
    if (resource) params.resource = resource;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await apiClient.get<PaginatedAuditLogsResponse>('/audit-logs', { params });
    return response.data;
  },

  exportLogs: async (format: 'csv' | 'pdf', startDate?: string, endDate?: string): Promise<void> => {
    const params: Record<string, string> = { format };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await apiClient.get('/audit-logs/export', { 
      params,
      responseType: 'blob' 
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.${format}`);
    document.body.appendChild(link);
    link.click();
    
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};