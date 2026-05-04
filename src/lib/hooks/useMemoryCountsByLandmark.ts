'use client';

import { useQuery } from '@tanstack/react-query';
import { LANDMARKS } from '@/lib/constants/landmarks';

interface MemoryCountsResponse {
  success: boolean;
  message: string;
  data: Record<string, number>;
}

/**
 * Returns a map of landmark ID → memory count.
 *
 * Currently backed by a lightweight API route that aggregates
 * counts from the existing data source. Swap the queryFn for a
 * real Prisma endpoint once SCRUM-54 database integration lands.
 */
export function useMemoryCountsByLandmark() {
  return useQuery({
    queryKey: ['memory-counts', 'by-landmark'],
    queryFn: async () => {
      const res = await fetch('/api/prisma/memory/counts-by-landmark', {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Failed to fetch memory counts');
      return res.json() as Promise<MemoryCountsResponse>;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
    retry: 1,
    placeholderData: {
      success: true,
      message: 'placeholder',
      data: Object.fromEntries(LANDMARKS.map((l) => [l.id, 0])),
    },
  });
}
