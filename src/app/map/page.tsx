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

function areStringArraysEqual(a: string[], b: string[]) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function areNumberArraysEqual(a: number[], b: number[]) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function areGroupOptionsEqual(a: GroupFilterOption[], b: GroupFilterOption[]) {
  return (
    a.length === b.length &&
    a.every(
      (value, index) =>
        value.id === b[index]?.id && value.name === b[index]?.name
    )
  );
}

function areLocationOptionsEqual(
  a: LocationFilterOption[],
  b: LocationFilterOption[]
) {
  return (
    a.length === b.length &&
    a.every(
      (value, index) =>
        value.id === b[index]?.id && value.name === b[index]?.name
    )
  );
}

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
      setAvailableTags((prev) =>
        areStringArraysEqual(prev, options.availableTags)
          ? prev
          : options.availableTags
      );
      setAvailableYears((prev) =>
        areNumberArraysEqual(prev, options.availableYears)
          ? prev
          : options.availableYears
      );
      setAvailableGroups((prev) =>
        areGroupOptionsEqual(prev, options.availableGroups)
          ? prev
          : options.availableGroups
      );
      setAvailableLocations((prev) =>
        areLocationOptionsEqual(prev, options.availableLocations)
          ? prev
          : options.availableLocations
      );
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
