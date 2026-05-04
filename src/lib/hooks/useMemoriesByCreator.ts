'use client';

import { useQuery } from '@tanstack/react-query';
import type { MemoryWithRelations } from '@/lib/schemas';

interface MemoriesByCreatorResponse {
  success: boolean;
  message: string;
  data: MemoryWithRelations[];
}

export function useMemoriesByCreator(userId: string | undefined) {
  return useQuery({
    queryKey: ['memories', 'by-creator', userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const res = await fetch(
        `/api/prisma/memory/get-by-creator?userId=${encodeURIComponent(userId)}`,
        { cache: 'no-store' }
      );

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(
          json?.message ?? `Failed to fetch memories (${res.status})`
        );
      }

      const data = await res.json().catch(async () => {
        const text = await res.text();
        throw new Error(`Unexpected response format: ${text}`);
      });

      if (!data.success) {
        throw new Error(data.message ?? 'Failed to fetch memories');
      }

      return data as MemoriesByCreatorResponse;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
    retry: 1,
  });
}
