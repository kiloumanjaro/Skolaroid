'use client';

import { useMutation } from '@tanstack/react-query';

interface DeleteUserResponse {
  success: boolean;
  message: string;
}

export function useDeleteUser() {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/prisma/user/delete', {
        method: 'DELETE',
      });

      const body = await res.json();

      if (!res.ok) {
        throw new Error(
          (body as { error?: string }).error ?? 'Failed to delete user'
        );
      }

      return body as DeleteUserResponse;
    },
  });
}
