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
  mediaFiles?: File[];
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
    mutationFn: async ({
      mediaFile,
      mediaFiles,
      ...data
    }: CreateMemoryPayload) => {
      const providedMediaURLs = data.mediaURLs ?? [];
      let resolvedMediaURLs = providedMediaURLs;

      // If URLs were not pre-uploaded by the caller, upload pending files here.
      if (resolvedMediaURLs.length === 0 && mediaFiles?.length) {
        resolvedMediaURLs = await Promise.all(
          mediaFiles.map((file) => uploadMediaFile(file))
        );
      } else if (resolvedMediaURLs.length === 0 && mediaFile) {
        resolvedMediaURLs = [await uploadMediaFile(mediaFile)];
      }

      // Create the memory record with resolved media URLs.
      const payload: CreateMemoryServerInput = {
        ...data,
        ...(resolvedMediaURLs.length > 0
          ? {
              mediaURL: resolvedMediaURLs[0],
              mediaURLs: resolvedMediaURLs,
            }
          : {}),
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
    onSuccess: (data, variables) => {
      // Invalidate all memory-related queries
      queryClient.invalidateQueries({ queryKey: ['memories'] });

      // Invalidate specific group queries if creating group memory
      if (variables.privateGroupId) {
        queryClient.invalidateQueries({
          queryKey: ['memories', 'by-group', variables.privateGroupId],
        });
        queryClient.invalidateQueries({
          queryKey: ['group', variables.privateGroupId],
        });
      }
    },
  });
}
