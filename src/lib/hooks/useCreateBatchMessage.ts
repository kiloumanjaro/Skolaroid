'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CreateBatchMessagePayload {
  batchId: string;
  content: string;
  locationId: string;
}

interface CreateBatchMessageResponse {
  success: boolean;
  message: string;
  data: { id: string };
}

export function useCreateBatchMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      batchId,
      content,
      locationId,
    }: CreateBatchMessagePayload) => {
      const res = await fetch(`/api/prisma/batch/${batchId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, locationId }),
      });

      const json = (await res.json()) as CreateBatchMessageResponse;

      if (!res.ok) {
        throw new Error(json.message ?? 'Failed to create message');
      }

      return json;
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
    },
  });
}
