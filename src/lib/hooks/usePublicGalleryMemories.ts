'use client';

import { useQuery } from '@tanstack/react-query';
import type { MemoryWithCoordinates } from '@/lib/hooks/useAllMemoriesWithCoordinates';

interface PublicGalleryResponse {
  success: boolean;
  message: string;
  data: MemoryWithCoordinates[];
  era: number | null;
}

export function usePublicGalleryMemories(era: number | null) {
  return useQuery({
    queryKey: ['public-gallery', era],
    queryFn: async () => {
      const url =
        era !== null
          ? `/api/public/memory/gallery?era=${era}`
          : '/api/public/memory/gallery';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch public gallery');
      return res.json() as Promise<PublicGalleryResponse>;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
