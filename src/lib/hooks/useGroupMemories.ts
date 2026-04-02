'use client';

import { useQuery } from '@tanstack/react-query';
import { MemoryWithRelations } from '@/lib/schemas';

export function useGroupMemories(groupId: string | undefined) {
  return useQuery({
    queryKey: ['memories', 'by-group', groupId],
    queryFn: async () => {
      if (!groupId) throw new Error('Group ID is required');

      const res = await fetch(
        `/api/prisma/memory/get-by-group?groupId=${groupId}`
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to fetch group memories');
      }

      const json = await res.json();
      return json.data as MemoryWithRelations[];
    },
    enabled: !!groupId,
  });
}
