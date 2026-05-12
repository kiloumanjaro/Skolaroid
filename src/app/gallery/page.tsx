'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';
import { useMemo } from 'react';
import { GalleryExperience } from '@/components/gallery/GalleryExperience';
import { useAllMemoriesWithCoordinates } from '@/lib/hooks/useAllMemoriesWithCoordinates';
import {
  applyMemoryFilters,
  copyMemoryViewSearchParams,
  filterMemoriesByEra,
  readEraFromSearchParams,
  readMemoryFiltersFromSearchParams,
  sortMemories,
} from '@/lib/memory-view-filters';

function GalleryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeEra = useMemo(
    () => readEraFromSearchParams(searchParams),
    [searchParams]
  );
  const filters = useMemo(
    () => readMemoryFiltersFromSearchParams(searchParams),
    [searchParams]
  );
  const { data: response, isLoading, error } = useAllMemoriesWithCoordinates();
  const visibleMemories = useMemo(() => {
    const eraMemories = filterMemoriesByEra(response?.data ?? [], activeEra);
    const filteredMemories = applyMemoryFilters(eraMemories, filters);
    return sortMemories(filteredMemories, filters.sortBy);
  }, [activeEra, filters, response?.data]);
  const mapHrefBase = useMemo(
    () => copyMemoryViewSearchParams(searchParams),
    [searchParams]
  );

  return (
    <GalleryExperience
      activeEra={activeEra}
      memories={visibleMemories}
      isLoading={isLoading}
      error={error instanceof Error ? error : null}
      onMemoryOpen={(memoryId, imageIndex = 0) => {
        const nextParams = new URLSearchParams(mapHrefBase.toString());
        nextParams.set('memoryId', memoryId);
        if (imageIndex > 0) {
          nextParams.set('imageIndex', String(imageIndex));
        } else {
          nextParams.delete('imageIndex');
        }
        router.push(`/map?${nextParams.toString()}`);
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
