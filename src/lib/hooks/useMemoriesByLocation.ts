'use client';

import { useQuery } from '@tanstack/react-query';
import type { MemoryWithRelations } from '@/lib/schemas';

interface MemoriesByLocationResponse {
  success: boolean;
  message: string;
  data: MemoryWithRelations[];
}

export function useMemoriesByLocation(locationId: string | null) {
  return useQuery({
    queryKey: ['memories', 'by-location', locationId],
    queryFn: async () => {
      const res = await fetch(
        `/api/prisma/memory/get-by-location?locationId=${encodeURIComponent(locationId!)}`,
        { cache: 'no-store' }
      );
      if (!res.ok) throw new Error('Failed to fetch memories');
      return res.json() as Promise<MemoriesByLocationResponse>;
    },
    enabled: !!locationId,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
    retry: 1,
  });
}
