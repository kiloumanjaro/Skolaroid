'use client';

import { useQuery } from '@tanstack/react-query';
import type { GroupResponse } from '@/lib/hooks/useCreateGroup';

type GroupDetailResponse = GroupResponse;

export function useGroupById(groupId: string) {
  return useQuery({
    queryKey: ['groups', groupId],
    queryFn: async (): Promise<GroupDetailResponse> => {
      const res = await fetch(
        `/api/prisma/group/${encodeURIComponent(groupId)}`
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Failed to fetch group');
      return body.data;
    },
    enabled: !!groupId,
  });
}
