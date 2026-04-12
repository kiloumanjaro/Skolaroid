'use client';

import { useInfiniteQuery } from '@tanstack/react-query';

export interface AuditLogFilters {
  action?: string;
  adminId?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: 'asc' | 'desc';
}

export interface AuditLogEntry {
  id: string;
  adminId: string;
  action: string;
  targetType: 'MEMORY' | 'REPORT';
  targetMemoryId: string | null;
  targetReportId: string | null;
  reason: string | null;
  createdAt: string;
  admin: { id: string; firstName: string; lastName: string };
  targetMemory: { id: string; title: string } | null;
  targetReport: { id: string; reason: string; state: string } | null;
}

interface AuditLogPage {
  success: boolean;
  data: {
    items: AuditLogEntry[];
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export function useAuditLog(filters: AuditLogFilters) {
  return useInfiniteQuery({
    queryKey: ['audit-log', filters],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (filters.action) params.set('action', filters.action);
      if (filters.adminId) params.set('adminId', filters.adminId);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);
      if (filters.sort) params.set('sort', filters.sort);
      if (pageParam) params.set('cursor', pageParam);

      const res = await fetch(`/api/prisma/moderation/audit-log?${params}`);
      if (!res.ok) throw new Error('Failed to fetch audit log');
      return res.json() as Promise<AuditLogPage>;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.data.nextCursor ?? undefined,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
