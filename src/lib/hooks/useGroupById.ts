'use client';

import { useQuery } from '@tanstack/react-query';

interface GroupMemberResponse {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

interface GroupDetailResponse {
  id: string;
  name: string;
  description: string | null;
  message: string | null;
  creatorId: string | null;
  creator: GroupMemberResponse | null;
  members: GroupMemberResponse[];
  _count: { members: number; memories: number };
  createdAt: string;
  updatedAt: string;
}

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
