'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

interface MemberAction {
  groupId: string;
  email: string;
}

interface MemberRoleAction extends MemberAction {
  role: 'ADMIN' | 'MEMBER';
}

export function useAddGroupMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, email }: MemberAction) => {
      const res = await fetch(
        `/api/prisma/group/${encodeURIComponent(groupId)}/members`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }
      );

      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Failed to add member');
      return body.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['groups', variables.groupId],
      });
      queryClient.invalidateQueries({ queryKey: ['groups', 'mine'] });
    },
  });
}

export function useRemoveGroupMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, email }: MemberAction) => {
      const res = await fetch(
        `/api/prisma/group/${encodeURIComponent(groupId)}/members`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }
      );

      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Failed to remove member');
      return body.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['groups', variables.groupId],
      });
      queryClient.invalidateQueries({ queryKey: ['groups', 'mine'] });
    },
  });
}

export function useUpdateGroupMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, email, role }: MemberRoleAction) => {
      const res = await fetch(
        `/api/prisma/group/${encodeURIComponent(groupId)}/members`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, role }),
        }
      );

      const body = await res.json();
      if (!res.ok)
        throw new Error(body.error ?? 'Failed to update member role');
      return body.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['groups', variables.groupId],
      });
      queryClient.invalidateQueries({ queryKey: ['groups', 'mine'] });
    },
  });
}
