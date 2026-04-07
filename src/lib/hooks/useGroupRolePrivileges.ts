'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { GroupRolePrivilegesResponse } from '@/lib/hooks/useCreateGroup';

interface GroupRolePrivilegesResult {
  currentUserRole: 'OWNER' | 'ADMIN' | 'MEMBER';
  rolePrivileges: GroupRolePrivilegesResponse;
}

export function useGroupRolePrivileges(groupId: string) {
  return useQuery({
    queryKey: ['groups', groupId, 'privileges'],
    queryFn: async (): Promise<GroupRolePrivilegesResult> => {
      const res = await fetch(
        `/api/prisma/group/${encodeURIComponent(groupId)}/privileges`
      );
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error ?? 'Failed to fetch role privileges');
      }
      return body.data;
    },
    enabled: !!groupId,
  });
}

export function useUpdateGroupRolePrivileges(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rolePrivileges: GroupRolePrivilegesResponse) => {
      const res = await fetch(
        `/api/prisma/group/${encodeURIComponent(groupId)}/privileges`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ privileges: rolePrivileges }),
        }
      );

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error ?? 'Failed to update role privileges');
      }
      return body.data as GroupRolePrivilegesResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['groups', groupId],
      });
      queryClient.invalidateQueries({
        queryKey: ['groups', groupId, 'privileges'],
      });
      queryClient.invalidateQueries({
        queryKey: ['groups', 'mine'],
      });
    },
  });
}
