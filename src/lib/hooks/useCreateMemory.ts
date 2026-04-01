'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CreateMemoryServerInput,
  MemoryWithRelations,
} from '@/lib/schemas';

interface CreateMemoryResponse {
  success: boolean;
  message: string;
  data: MemoryWithRelations;
}

export interface CreateMemoryPayload extends CreateMemoryServerInput {
  mediaFile?: File | null;
}

/** Upload a file to Supabase Storage and return its public URL. */
async function uploadMediaFile(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);

  const res = await fetch('/api/storage/upload-memory-media', {
    method: 'POST',
    body: form,
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    const detail = json.detail ? ` (${json.detail})` : '';
    throw new Error((json.message ?? 'Failed to upload media file') + detail);
  }
  return json.url as string;
}

export function useCreateMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    retry: 1,
    mutationFn: async ({ mediaFile, ...data }: CreateMemoryPayload) => {
      // 1. Upload media file first (if provided) to get the public URL.
      let mediaURL: string | undefined;
      if (mediaFile) {
        mediaURL = await uploadMediaFile(mediaFile);
      }

      // 2. Create the memory record with the resolved URL.
      const payload: CreateMemoryServerInput = {
        ...data,
        ...(mediaURL ? { mediaURL } : {}),
      };

      const res = await fetch('/api/prisma/memory/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      if (!res.ok) {
        let errorMessage = 'Failed to create memory';
        try {
          const errorBody = JSON.parse(text);
          errorMessage = errorBody.message || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }
      return JSON.parse(text) as CreateMemoryResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
    },
  });
}
