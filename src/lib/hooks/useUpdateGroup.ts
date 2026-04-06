'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateGroupServerInput } from '@/lib/schemas';

interface UpdateGroupVariables {
  groupId: string;
  data: UpdateGroupServerInput;
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, data }: UpdateGroupVariables) => {
      const res = await fetch(
        `/api/prisma/group/${encodeURIComponent(groupId)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );

      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Failed to update group');
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
