'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapComponent } from '@/components/map';
import type { MemoryFilters } from '@/components/map/filter-memory-types';
import {
  readEraFromSearchParams,
  readMemoryFiltersFromSearchParams,
  writeMemoryFiltersToSearchParams,
} from '@/lib/memory-view-filters';

export default function MapPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeEra = useMemo(
    () => readEraFromSearchParams(searchParams),
    [searchParams]
  );
  const filters = useMemo<MemoryFilters>(
    () => readMemoryFiltersFromSearchParams(searchParams),
    [searchParams]
  );
  const setFilters = useCallback(
    (nextFilters: MemoryFilters) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      writeMemoryFiltersToSearchParams(nextParams, nextFilters);

      const nextSearch = nextParams.toString();
      const nextUrl = nextSearch ? `/map?${nextSearch}` : '/map';
      const currentUrl = `/map${
        searchParams.toString() ? `?${searchParams.toString()}` : ''
      }`;

      if (nextUrl !== currentUrl) {
        router.replace(nextUrl, { scroll: false });
      }
    },
    [router, searchParams]
  );

  return (
    <div className="relative h-dvh overflow-hidden bg-background">
      <div className="h-full min-w-0 overflow-hidden">
        <MapComponent
          activeEraFromUrl={activeEra}
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>
    </div>
  );
}
