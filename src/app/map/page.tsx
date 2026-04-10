'use client';

import { useCallback, useState } from 'react';
import { MapComponent } from '@/components/map';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/header';
import {
  DEFAULT_FILTERS,
  FilterMemoriesPanel,
  type GroupFilterOption,
  type LocationFilterOption,
  type MemoryFilters,
} from '@/components/map/FilterMemoriesModal';

export default function MapPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<MemoryFilters>(DEFAULT_FILTERS);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [availableGroups, setAvailableGroups] = useState<GroupFilterOption[]>(
    []
  );
  const [availableLocations, setAvailableLocations] = useState<
    LocationFilterOption[]
  >([]);

  const handleFilterOptionsChange = useCallback(
    (options: {
      availableTags: string[];
      availableYears: number[];
      availableGroups: GroupFilterOption[];
      availableLocations: LocationFilterOption[];
    }) => {
      setAvailableTags(options.availableTags);
      setAvailableYears(options.availableYears);
      setAvailableGroups(options.availableGroups);
      setAvailableLocations(options.availableLocations);
    },
    []
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header />
      <div className="relative flex flex-1 overflow-hidden pt-16">
        <Sidebar
          drawerOpen={drawerOpen}
          setDrawerOpen={setDrawerOpen}
          className="top-16 z-30 h-[calc(100vh-4rem)]"
          contentClassName="overflow-hidden"
          expandedWidthClassName="w-[298px]"
          stripAriaLabel={drawerOpen ? 'Close filters' : 'Open filters'}
          expandOnHover={false}
        >
          <FilterMemoriesPanel
            active={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            filters={filters}
            onApply={setFilters}
            availableTags={availableTags}
            availableYears={availableYears}
            availableGroups={availableGroups}
            availableLocations={availableLocations}
          />
        </Sidebar>

        <div
          className={`flex-1 overflow-hidden transition-all duration-300 ease-in-out ${
            drawerOpen ? 'ml-[298px]' : 'ml-2.5'
          }`}
        >
          <MapComponent
            filters={filters}
            onFilterOptionsChange={handleFilterOptionsChange}
          />
        </div>
      </div>
    </div>
  );
}
