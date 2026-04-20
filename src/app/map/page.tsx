'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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

const SIDEBAR_TRANSITION_MS = 300;

function waitForTransition(duration: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, duration);
  });
}

export default function MapPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stripTucked, setStripTucked] = useState(false);
  const [memoryDetailOpen, setMemoryDetailOpen] = useState(false);
  const [filterInteractionLocked, setFilterInteractionLocked] = useState(false);
  const [filters, setFilters] = useState<MemoryFilters>(DEFAULT_FILTERS);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [availableGroups, setAvailableGroups] = useState<GroupFilterOption[]>(
    []
  );
  const [availableLocations, setAvailableLocations] = useState<
    LocationFilterOption[]
  >([]);
  const unlockTimerRef = useRef<number | null>(null);

  const clearUnlockTimer = useCallback(() => {
    if (unlockTimerRef.current !== null) {
      window.clearTimeout(unlockTimerRef.current);
      unlockTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearUnlockTimer(), [clearUnlockTimer]);

  const handleDrawerOpenChange = useCallback(
    (open: boolean) => {
      if (filterInteractionLocked || memoryDetailOpen) {
        setDrawerOpen(false);
        return;
      }

      clearUnlockTimer();
      setStripTucked(false);
      setDrawerOpen(open);
    },
    [clearUnlockTimer, filterInteractionLocked, memoryDetailOpen]
  );

  const handleMemoryDetailOpenRequest = useCallback(async () => {
    clearUnlockTimer();
    setFilterInteractionLocked(true);

    if (drawerOpen) {
      setDrawerOpen(false);
      await waitForTransition(SIDEBAR_TRANSITION_MS);
    }

    setStripTucked(true);
    await waitForTransition(SIDEBAR_TRANSITION_MS);
  }, [clearUnlockTimer, drawerOpen]);

  const handleMemoryDetailOpenStateChange = useCallback(
    (open: boolean) => {
      clearUnlockTimer();
      setMemoryDetailOpen(open);
      setDrawerOpen(false);

      if (open) {
        setFilterInteractionLocked(true);
        setStripTucked(true);
        return;
      }

      setStripTucked(false);
      unlockTimerRef.current = window.setTimeout(() => {
        unlockTimerRef.current = null;
        setFilterInteractionLocked(false);
      }, SIDEBAR_TRANSITION_MS);
    },
    [clearUnlockTimer]
  );

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
          setDrawerOpen={handleDrawerOpenChange}
          className="top-16 z-30 h-[calc(100vh-4rem)]"
          contentClassName="overflow-hidden"
          expandedWidthClassName="w-[min(calc(100vw-1rem),298px)] md:w-[298px]"
          stripAriaLabel={drawerOpen ? 'Close filters' : 'Open filters'}
          expandOnHover={false}
          stripTucked={stripTucked}
          stripDisabled={filterInteractionLocked}
        >
          <FilterMemoriesPanel
            active={drawerOpen}
            onClose={() => handleDrawerOpenChange(false)}
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
            drawerOpen
              ? 'ml-2.5 md:ml-[298px]'
              : stripTucked
                ? 'ml-0'
                : 'ml-2.5'
          }`}
        >
          <MapComponent
            filters={filters}
            onFilterOptionsChange={handleFilterOptionsChange}
            onMemoryDetailOpenRequest={handleMemoryDetailOpenRequest}
            onMemoryDetailOpenStateChange={handleMemoryDetailOpenStateChange}
          />
        </div>
      </div>
    </div>
  );
}
