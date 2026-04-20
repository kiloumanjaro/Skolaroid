'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MapComponent } from '@/components/map';
import { Header } from '@/components/header';
import { ColorStrip } from '@/components/ui/color-strip';
import { cn } from '@/lib/utils';
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
const MAP_FILTER_PANEL_WIDTH_CLASSNAME =
  'w-[min(calc(100vw-1rem),298px)] md:w-[298px]';

function waitForTransition(duration: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, duration);
  });
}

export default function MapPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stripTucked, setStripTucked] = useState(false);
  const [headerTucked, setHeaderTucked] = useState(false);
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
    setHeaderTucked(true);
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
        setHeaderTucked(true);
        return;
      }

      setStripTucked(false);
      setHeaderTucked(false);
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
    <div className="relative h-dvh overflow-hidden bg-background">
      <Header hidden={headerTucked} variant="floating" />
      <div className="relative flex h-full w-full overflow-hidden">
        {!drawerOpen ? (
          <button
            type="button"
            onClick={() => handleDrawerOpenChange(true)}
            disabled={filterInteractionLocked}
            className={cn(
              'absolute left-0 top-0 z-30 h-full w-2.5 shrink-0 transition-transform duration-300 ease-in-out hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skolaroid-blue/40 disabled:cursor-default disabled:hover:opacity-100',
              stripTucked ? '-translate-x-full' : 'translate-x-0',
              filterInteractionLocked && 'pointer-events-none'
            )}
            aria-label="Open filters"
          >
            <ColorStrip className="h-full" />
          </button>
        ) : null}

        <div
          className={cn(
            'relative z-30 flex h-full shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out',
            drawerOpen && !stripTucked
              ? MAP_FILTER_PANEL_WIDTH_CLASSNAME
              : 'w-0'
          )}
        >
          <div
            className={cn(
              'scrollbar-hide h-full bg-card transition-[width,opacity] duration-300 ease-in-out',
              drawerOpen && !stripTucked
                ? 'w-[calc(100%-10px)] opacity-100'
                : 'w-0 opacity-0'
            )}
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {drawerOpen ? (
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
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => handleDrawerOpenChange(false)}
            disabled={filterInteractionLocked}
            className={cn(
              'h-full w-2.5 shrink-0 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skolaroid-blue/40 disabled:cursor-default disabled:hover:opacity-100',
              filterInteractionLocked && 'pointer-events-none'
            )}
            aria-label="Close filters"
          >
            <ColorStrip className="h-full" />
          </button>
        </div>

        <div className="h-full min-w-0 flex-1 overflow-hidden">
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
