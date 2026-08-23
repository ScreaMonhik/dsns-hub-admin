import { apiClient } from './apiClient';

export interface DashboardSummary {
  users: { total: number; active: number; blocked: number; admins: number };
  projects: { total: number; draft: number; published: number; archived: number };
  news: { total: number; draft: number; published: number; archived: number };
  polls: { total: number; active: number; archived: number; totalVotes: number };
}

export interface ActivityChartData {
  date: string;
  newUsers: number;
  newProjects: number;
  votes: number;
  engagements: number;
  comments: number;
}

export interface RecentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

export type DraftEntityType = 'NEWS' | 'PROJECT' | 'POLL' | 'DOCUMENT';

export interface PendingDraft {
  id: string;
  title: string;
  type: DraftEntityType;
  authorName: string;
  createdAt: string;
}

export interface DashboardAnalyticsResponse {
  summary: DashboardSummary;
  activityChart: ActivityChartData[];
  recentActivity: {
    latestUsers: RecentUser[];
    pendingDrafts: PendingDraft[];
  };
}

export const analyticsApi = {
  getDashboardData: async (startDate?: string, endDate?: string): Promise<DashboardAnalyticsResponse> => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await apiClient.get<DashboardAnalyticsResponse>('/analytics/dashboard', { params });
    
    // DEBUG: Виводимо сирі дані від бекенду в консоль, щоб перевірити наявність коментарів
    console.log('RAW JSON FROM BACKEND:', JSON.parse(JSON.stringify(response.data.activityChart)));
    
    // Нормалізація даних: гарантуємо, що всі необхідні ключі існують для коректного рендеру Recharts
    if (response.data && response.data.activityChart) {
      response.data.activityChart = response.data.activityChart.map(item => ({
        ...item,
        newUsers: item.newUsers || 0,
        newProjects: item.newProjects || 0,
        votes: item.votes || 0,
        engagements: item.engagements || 0,
        comments: item.comments || 0,
      }));
    }
    
    return response.data;
  },

  exportDashboard: async (format: 'csv' | 'pdf', startDate?: string, endDate?: string): Promise<void> => {
    const params: Record<string, string> = { format };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await apiClient.get('/analytics/export', { 
      params,
      responseType: 'blob' 
    });

    // Створення посилання для завантаження файлу
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dsns_report_${new Date().toISOString().split('T')[0]}.${format}`);
    document.body.appendChild(link);
    link.click();
    
    // Очищення пам'яті
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};