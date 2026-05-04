'use client';

import { useQuery } from '@tanstack/react-query';
import type { ModerationStatus } from '@/lib/schemas';

export interface AdminMemoryItem {
  id: string;
  title: string;
  description: string | null;
  mediaURLs: string[];
  moderationStatus: ModerationStatus;
  createdAt: string;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  programBatch: {
    batch: { year: number };
  };
  location: {
    buildingName: string;
  };
  tags: { id: string; name: string; slug: string }[];
  _count: {
    reports: number;
  };
}

interface AdminMemoriesResponse {
  success: boolean;
  message: string;
  data: AdminMemoryItem[];
}

export function useAdminMemories(status: ModerationStatus) {
  return useQuery({
    queryKey: ['admin-memories', status],
    queryFn: async () => {
      const res = await fetch(
        `/api/prisma/memory/admin/get-by-status?status=${encodeURIComponent(status)}`,
        {
          cache: 'no-store',
        }
      );
      if (!res.ok) throw new Error('Failed to fetch memories');
      return res.json() as Promise<AdminMemoriesResponse>;
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
