'use client';

import { useQuery } from '@tanstack/react-query';

export interface AdminReportItem {
  id: string;
  reason: string;
  state: 'OPEN' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
  resolutionNote: string | null;
  resolvedAt: string | null;
  reporter: {
    firstName: string;
    lastName: string;
  };
  memory: {
    id: string;
    title: string;
    mediaURLs: string[];
  };
  resolvedBy: {
    firstName: string;
    lastName: string;
  } | null;
}

interface AdminReportsResponse {
  success: boolean;
  message: string;
  data: AdminReportItem[];
}

export function useAdminReports(state?: 'OPEN' | 'RESOLVED' | 'DISMISSED') {
  return useQuery({
    queryKey: ['admin-reports', state],
    queryFn: async () => {
      const params = state ? `?state=${encodeURIComponent(state)}` : '';
      const res = await fetch(`/api/prisma/report/admin/get-all${params}`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Failed to fetch reports');
      return res.json() as Promise<AdminReportsResponse>;
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    retry: 1,
  });
}
