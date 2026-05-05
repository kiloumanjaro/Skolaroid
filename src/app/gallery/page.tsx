'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { GalleryExperience } from '@/components/gallery/GalleryExperience';
import { useAllMemoriesWithCoordinates } from '@/lib/hooks/useAllMemoriesWithCoordinates';

function GalleryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeEra = parseInt(searchParams.get('era') || '2020', 10);
  const { data: response, isLoading, error } = useAllMemoriesWithCoordinates();
  const visibleMemories = useMemo(
    () =>
      (response?.data ?? []).filter(
        (memory) =>
          memory.moderationStatus !== 'REJECTED' &&
          memory.moderationStatus !== 'REMOVED'
      ),
    [response?.data]
  );

  return (
    <GalleryExperience
      activeEra={activeEra}
      memories={visibleMemories}
      isLoading={isLoading}
      error={error instanceof Error ? error : null}
      onMemoryOpen={(memoryId, imageIndex = 0) => {
        router.push(
          `/map?memoryId=${encodeURIComponent(memoryId)}&era=${activeEra}&imageIndex=${imageIndex}`
        );
      }}
    />
  );
}

export default function GalleryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full flex-col items-center justify-center bg-gray-50">
          <p className="text-lg text-gray-600">Loading gallery...</p>
        </div>
      }
    >
      <GalleryPageContent />
    </Suspense>
  );
}
