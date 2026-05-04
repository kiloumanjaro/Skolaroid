'use client';

import { useState } from 'react';
import { MapComponent } from '@/components/map';
import {
  DEFAULT_FILTERS,
  type MemoryFilters,
} from '@/components/map/filter-memory-types';

export default function MapPage() {
  const [filters, setFilters] = useState<MemoryFilters>(DEFAULT_FILTERS);

  return (
    <div className="relative h-dvh overflow-hidden bg-background">
      <div className="h-full min-w-0 overflow-hidden">
        <MapComponent filters={filters} onFiltersChange={setFilters} />
      </div>
    </div>
  );
}
