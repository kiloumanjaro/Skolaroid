'use client';

import { MapComponent } from '@/components/map';
import { DEFAULT_FILTERS } from '@/components/map/filter-memory-types';

export default function MapPage() {
  return (
    <div className="relative h-dvh overflow-hidden bg-background">
      <div className="h-full min-w-0 overflow-hidden">
        <MapComponent filters={DEFAULT_FILTERS} />
      </div>
    </div>
  );
}
