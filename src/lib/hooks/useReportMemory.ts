'use client';

import { useMutation } from '@tanstack/react-query';
import type { CreateReportInput } from '@/lib/schemas';

export interface ReportMemoryResponse {
  success: boolean;
  message: string;
  data?: {
    reportId: string;
    status: string;
    deduped: boolean;
  };
}

export interface ReportMemoryError extends Error {
  status: number;
  serverMessage: string;
}

export function useReportMemory() {
  return useMutation({
    mutationFn: async (
      input: CreateReportInput
    ): Promise<ReportMemoryResponse> => {
      const res = await fetch('/api/prisma/memory/report/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      const body: ReportMemoryResponse = await res.json();

      if (!res.ok) {
        const err = new Error(
          body.message ?? 'Failed to submit report'
        ) as ReportMemoryError;
        err.status = res.status;
        err.serverMessage = body.message ?? 'Failed to submit report';
        throw err;
      }

      return body;
    },
  });
}
