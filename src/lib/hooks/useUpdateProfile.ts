'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateProfileInput } from '@/lib/schemas';

interface UpdateProfileResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProfileInput) => {
      const res = await fetch('/api/prisma/user/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const body = (await res.json()) as UpdateProfileResponse;
      if (!res.ok)
        throw new Error(
          body.error ?? body.message ?? 'Failed to update profile'
        );
      return body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}
