'use client';

import { useRouter, useSearchParams } from 'next/navigation';
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

export default function GalleryPageClient() {
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
    const all = response?.data ?? [];
    let scoped;
    if (filters.selectedYear) {
      // Year overrides era — filter from global set
      scoped = all.filter((m) => {
        if (
          m.moderationStatus === 'REJECTED' ||
          m.moderationStatus === 'REMOVED'
        )
          return false;
        const dv = (m as { memoryDate?: string }).memoryDate;
        const y = dv
          ? new Date(dv).getFullYear()
          : new Date(m.createdAt ?? Date.now()).getFullYear();
        return y === filters.selectedYear;
      });
    } else {
      scoped = filterMemoriesByEra(all, activeEra);
    }
    const filteredMemories = applyMemoryFilters(scoped, filters);
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
