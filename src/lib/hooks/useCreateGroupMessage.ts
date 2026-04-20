'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CreateGroupMessagePayload {
  groupId: string;
  content: string;
  locationId: string;
}

interface CreateGroupMessageResponse {
  success: boolean;
  message: string;
  data: { id: string };
}

export function useCreateGroupMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      content,
      locationId,
    }: CreateGroupMessagePayload) => {
      const res = await fetch(`/api/prisma/group/${groupId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, locationId }),
      });

      const json = (await res.json()) as CreateGroupMessageResponse;

      if (!res.ok) {
        throw new Error(json.message ?? 'Failed to create message');
      }

      return json;
    },

    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['memories', 'by-group', variables.groupId],
      });
      queryClient.invalidateQueries({ queryKey: ['memories'] });
    },
  });
}
