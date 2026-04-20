'use client';

import { useQuery } from '@tanstack/react-query';

export interface AdminAnalyticsLocation {
  rank: number;
  locationId: string;
  buildingName: string;
  memoryCount: number;
}

export interface AdminBatchEngagementRate {
  programBatchId: string;
  batchYear: number;
  programName: string;
  totalUsers: number;
  activeUsers: number;
  engagementRate: number;
}

export interface AdminAnalyticsData {
  generatedAt: string;
  windowDays: number;
  totals: {
    memories: number;
    users: number;
    activeUsers: number;
    activeUserRate: number;
    averageBatchEngagementRate: number;
  };
  memoriesByStatus: {
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REMOVED';
    count: number;
  }[];
  topLocations: AdminAnalyticsLocation[];
  batchEngagementRates: AdminBatchEngagementRate[];
}

interface AdminAnalyticsResponse {
  success: boolean;
  message: string;
  data: AdminAnalyticsData;
}

export function useAdminAnalytics(days = 30) {
  return useQuery({
    queryKey: ['admin-analytics', days],
    queryFn: async () => {
      const params = new URLSearchParams({ days: String(days) });
      const res = await fetch(`/api/prisma/admin/analytics?${params}`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return res.json() as Promise<AdminAnalyticsResponse>;
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    retry: 1,
  });
}
