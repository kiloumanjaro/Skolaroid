'use client';

import { useQuery } from '@tanstack/react-query';
import type { GroupResponse } from '@/lib/hooks/useCreateGroup';

interface ListGroupsResponse {
  success: boolean;
  message: string;
  data: GroupResponse[];
}

export function useUserGroups() {
  return useQuery({
    queryKey: ['groups', 'mine'],
    queryFn: async (): Promise<GroupResponse[]> => {
      const res = await fetch('/api/prisma/group/list');
      const body: ListGroupsResponse = await res.json();
      if (!res.ok)
        throw new Error(
          (body as unknown as { error: string }).error ??
            'Failed to fetch groups'
        );
      return body.data;
    },
  });
}
