'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { EditMemoryInput } from '@/lib/schemas';

interface UpdateMemoryPayload extends EditMemoryInput {
  memoryId: string;
}

export function useUpdateMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memoryId, ...data }: UpdateMemoryPayload) => {
      const res = await fetch(`/api/prisma/memory/${memoryId}/edit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? 'Failed to update memory');
      return body;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      queryClient.invalidateQueries({
        queryKey: ['memory', variables.memoryId],
      });
      queryClient.invalidateQueries({
        queryKey: ['memories', 'all-with-coordinates'],
      });
    },
  });
}
