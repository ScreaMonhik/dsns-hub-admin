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
}

export interface RecentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

export interface PendingProject {
  id: string;
  title: string;
  authorName: string;
  createdAt: string;
}

export interface DashboardAnalyticsResponse {
  summary: DashboardSummary;
  activityChart: ActivityChartData[];
  recentActivity: {
    latestUsers: RecentUser[];
    pendingProjects: PendingProject[];
  };
}

export const analyticsApi = {
  getDashboardData: async (): Promise<DashboardAnalyticsResponse> => {
    const response = await apiClient.get<DashboardAnalyticsResponse>('/analytics/dashboard');
    return response.data;
  },
};