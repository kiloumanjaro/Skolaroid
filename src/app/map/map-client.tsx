'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { MemoryFilters } from '@/components/map/filter-memory-types';
import {
  readEraFromSearchParams,
  readMemoryFiltersFromSearchParams,
  writeMemoryFiltersToSearchParams,
} from '@/lib/memory-view-filters';

const MapComponent = dynamic(
  () => import('@/components/map/MapComponent').then((mod) => mod.MapComponent),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-dvh items-center justify-center bg-white">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4384dc] border-t-transparent" />
          </div>
          <p className="font-hand text-base font-semibold text-gray-600">
            Loading map canvas...
          </p>
        </div>
      </div>
    ),
  }
);

export default function MapPageClient() {
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

  const handleEraChange = useCallback(
    (era: number) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set('era', String(era));
      // Clear year override and dependent filters atomically
      nextParams.delete('year');
      nextParams.delete('tags');
      nextParams.delete('locationId');

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
          onEraChange={handleEraChange}
        />
      </div>
    </div>
  );
}
