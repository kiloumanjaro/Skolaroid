'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ResolveReportInput } from '@/lib/schemas';

interface ResolveReportResponse {
  success: boolean;
  message: string;
  data: { id: string; state: string };
}

export function useResolveReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ResolveReportInput) => {
      const res = await fetch('/api/prisma/report/admin/resolve', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(
          (errorBody as { message?: string }).message ??
            'Failed to resolve report'
        );
      }
      return res.json() as Promise<ResolveReportResponse>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
    },
  });
}
