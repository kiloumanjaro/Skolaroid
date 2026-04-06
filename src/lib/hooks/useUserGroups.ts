'use client';

import { useQuery } from '@tanstack/react-query';

interface GroupMemberResponse {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

interface GroupResponse {
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
