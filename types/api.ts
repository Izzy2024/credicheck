export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { message?: string };
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardData {
  queriesToday: number;
  activeReferences: number;
  activeUsers: number;
  matchRate: string;
  referencesByMonth: Array<{ month: string; count: number }>;
  referencesByStatus: Array<{ status: string; count: number }>;
  topSearched: Array<{ name: string; count: number }>;
  recentActivity: Array<{
    id: string;
    action: string;
    resource: string;
    resourceId: string | null;
    details: string | null;
    userName: string;
    createdAt: string;
  }>;
  searchesByDay: Array<{ date: string; count: number }>;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  searchType: string;
  resultsCount: number;
  userId: string;
  createdAt: string;
}
