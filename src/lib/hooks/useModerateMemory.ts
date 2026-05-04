'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ModerateMemoryInput } from '@/lib/schemas';

interface ModerateMemoryResponse {
  success: boolean;
  message: string;
  data: { id: string; moderationStatus: string };
}

export function useModerateMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ModerateMemoryInput) => {
      const res = await fetch('/api/prisma/memory/admin/moderate', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(
          (errorBody as { message?: string }).message ??
            'Failed to moderate memory'
        );
      }
      return res.json() as Promise<ModerateMemoryResponse>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-memories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      queryClient.invalidateQueries({ queryKey: ['memory-counts'] });
      queryClient.invalidateQueries({ queryKey: ['public-gallery'] });
    },
  });
}
