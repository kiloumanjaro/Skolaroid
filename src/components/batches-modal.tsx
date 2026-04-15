'use client';

import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn, getEraFromBatchTag } from '@/lib/utils';
import { X, Search, SlidersHorizontal, Plus, MapPin } from 'lucide-react';
import {
  FilterMemoriesModal,
  DEFAULT_FILTERS,
  type MemoryFilters,
  type LocationFilterOption,
} from './map/FilterMemoriesModal';
import { useLocations } from '@/lib/hooks/useLocations';
import type { MemoryWithCoordinates } from '@/lib/hooks/useAllMemoriesWithCoordinates';

// =============================================================================
// TYPES
// =============================================================================

interface BatchesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The currently active map era (decade start year, e.g. 2020). */
  activeMapEra?: number;
  /** All memories from the parent map component (same data shown as map pins). */
  memories?: MemoryWithCoordinates[];
  /** Called when the user clicks "Add an Entry". Receives the currently selected decade. */
  onAddMemory?: (era: number | null) => void;
  /** Called when a memory card is clicked. The parent handles era switching, flyTo, and modal display. */
  onMemorySelected?: (memory: MemoryWithCoordinates) => void;
}

interface DecadeOption {
  label: string;
  value: number | null; // null = "All"
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Default active map era when no prop is provided. */
const DEFAULT_ACTIVE_ERA = 2020;

const DECADES: DecadeOption[] = [
  { label: 'All', value: null },
  { label: '2020s', value: 2020 },
  { label: '2010s', value: 2010 },
  { label: '2000s', value: 2000 },
  { label: '1990s', value: 1990 },
  { label: '1980s', value: 1980 },
  { label: '1970s', value: 1970 },
  { label: '1960s', value: 1960 },
  { label: '1950s', value: 1950 },
  { label: '1940s', value: 1940 },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function BatchesModal({
  open,
  onOpenChange,
  activeMapEra = DEFAULT_ACTIVE_ERA,
  memories: memoriesProp,
  onAddMemory,
  onMemorySelected,
}: BatchesModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDecade, setSelectedDecade] = useState<number | null>(
    activeMapEra
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<MemoryFilters>(DEFAULT_FILTERS);
  const { data: locationsData } = useLocations();

  const allMemories = useMemo<MemoryWithCoordinates[]>(
    () => memoriesProp ?? [],
    [memoriesProp]
  );

  // Extract unique tags and years from the resolved memory set for the filter panel
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    allMemories.forEach((m) =>
      (m.tags ?? []).forEach((t) => tagSet.add(t.name))
    );
    return Array.from(tagSet).sort();
  }, [allMemories]);

  const availableYears = useMemo(() => {
    const yearSet = new Set<number>();
    allMemories.forEach((m) => {
      if (m.createdAt) yearSet.add(new Date(m.createdAt).getFullYear());
    });
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [allMemories]);

  const availableLocations = useMemo<LocationFilterOption[]>(() => {
    // Prefer real API data sorted A–Z
    if (locationsData?.data?.length) {
      return [...locationsData.data]
        .sort((a, b) => a.buildingName.localeCompare(b.buildingName))
        .map((l) => ({ id: l.id, name: l.buildingName }));
    }
    // Fallback: derive unique building names from loaded memories
    const seen = new Map<string, string>();
    allMemories.forEach((m) => {
      const name = m.location?.buildingName;
      if (name && !seen.has(name)) seen.set(name, name);
    });
    return Array.from(seen.values())
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ id: name, name }));
  }, [locationsData, allMemories]);

  // Filter memories by era (batch tag), search, and applied filters (AND logic)
  const displayedMemories = useMemo<MemoryWithCoordinates[]>(() => {
    let result = [...allMemories];

    // Decade sidebar filter — era derived from batch tag (e.g. batch-2024 → 2020s)
    if (selectedDecade !== null) {
      result = result.filter(
        (m) => getEraFromBatchTag(m.tags ?? [], m.createdAt) === selectedDecade
      );
    }

    // Keyword search (title + description + tags)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          (m.description && m.description.toLowerCase().includes(q)) ||
          (m.tags ?? []).some((t) => t.name.toLowerCase().includes(q))
      );
    }

    // Visibility filter
    if (filters.visibility !== 'ALL') {
      result = result.filter((m) => m.visibility === filters.visibility);
    }

    // Tags filter (AND — memory must have ALL selected tags)
    if (filters.selectedTags.length > 0) {
      result = result.filter((m) => {
        const tagNames = (m.tags ?? []).map((t) => t.name);
        return filters.selectedTags.every((st) => tagNames.includes(st));
      });
    }

    // Year filter — based on createdAt
    if (filters.selectedYear !== null) {
      result = result.filter(
        (m) =>
          m.createdAt &&
          new Date(m.createdAt).getFullYear() === filters.selectedYear
      );
    }

    // Location filter — match memory's building name against selected location
    if (filters.selectedLocationId !== null) {
      const selectedLocation = availableLocations.find(
        (l) => l.id === filters.selectedLocationId
      );
      if (selectedLocation) {
        result = result.filter(
          (m) => m.location?.buildingName === selectedLocation.name
        );
      }
    }

    // Sort
    switch (filters.sortBy) {
      case 'date-newest':
        result.sort(
          (a, b) =>
            new Date(b.createdAt ?? '').getTime() -
            new Date(a.createdAt ?? '').getTime()
        );
        break;
      case 'date-oldest':
        result.sort(
          (a, b) =>
            new Date(a.createdAt ?? '').getTime() -
            new Date(b.createdAt ?? '').getTime()
        );
        break;
      case 'upvotes-high':
        result.sort((a, b) => (b._count?.votes ?? 0) - (a._count?.votes ?? 0));
        break;
      case 'upvotes-low':
        result.sort((a, b) => (a._count?.votes ?? 0) - (b._count?.votes ?? 0));
        break;
    }

    return result;
  }, [allMemories, selectedDecade, searchQuery, filters, availableLocations]);

  // Handle clicking a memory card — always delegates to the parent
  const handleMemoryCardClick = (memory: MemoryWithCoordinates) => {
    onMemorySelected?.(memory);
    onOpenChange(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setSearchQuery('');
    setFiltersOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none md:h-[85vh] md:w-[70vw] md:max-w-5xl md:flex-row"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Batches</DialogTitle>

        {/* ====== Sidebar ====== */}
        <div className="flex w-full shrink-0 flex-col border-b bg-card md:w-56 md:border-b-0 md:border-r">
          {/* Header */}
          <div className="flex items-center px-4 pb-3 pt-4 md:px-5 md:pt-5">
            <h2 className="text-2xl font-bold text-foreground">Batches</h2>
          </div>

          {/* Search */}
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by title, caption, or tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 border-0 bg-secondary pl-8 text-sm placeholder:text-muted-foreground focus-visible:ring-0"
              />
            </div>
          </div>

          {/* Decade List */}
          <div className="scrollbar-hide flex-1 overflow-x-auto overflow-y-hidden px-3 pb-4 md:overflow-y-auto">
            <div className="flex gap-2 md:block md:space-y-0.5">
              {DECADES.map((decade) => {
                const isSelected = selectedDecade === decade.value;
                const isActiveMap = decade.value === activeMapEra;
                return (
                  <button
                    key={decade.label}
                    onClick={() => setSelectedDecade(decade.value)}
                    className={cn(
                      'flex shrink-0 items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium transition-colors md:w-full',
                      isSelected
                        ? 'bg-secondary text-foreground'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    <span>{decade.label}</span>
                    {isActiveMap && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                        Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ====== Content Area ====== */}
        <div className="relative flex flex-1 flex-col overflow-hidden">
          {/* Content Header — Filters + Close buttons */}
          <div className="flex items-center justify-end gap-2 border-b px-4 py-3 md:px-5">
            <button
              onClick={() => setFiltersOpen(true)}
              className="flex items-center gap-2 border-2 border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
            <button
              onClick={handleClose}
              className="p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Memory Cards Grid */}
          <div className="scrollbar-hide flex-1 overflow-y-auto p-4 md:p-5">
            {displayedMemories.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {displayedMemories.map((memory) => (
                  <button
                    key={memory.id}
                    type="button"
                    onClick={() => handleMemoryCardClick(memory)}
                    className="cursor-pointer overflow-hidden border-2 border-border bg-card p-2 pb-12 text-left shadow-[4px_4px_0px_0px_#2d2d2d] transition-shadow hover:shadow-[5px_5px_0px_0px_#2d2d2d]"
                  >
                    {/* Image */}
                    {memory.mediaURL ? (
                      <div className="relative h-44 w-full overflow-hidden bg-secondary">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            memory.mediaURL === '/temporary_map.png'
                              ? '/assets/images/temporary_map.png'
                              : memory.mediaURL
                          }
                          alt={memory.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="relative flex h-44 items-center justify-center bg-secondary">
                        <span className="text-sm text-muted-foreground">
                          No image
                        </span>
                      </div>
                    )}

                    {/* Info - Caption area */}
                    <div className="absolute bottom-0 left-0 right-0 px-3 pb-2 pt-1">
                      <h3 className="text-sm font-semibold text-foreground">
                        {memory.title}
                      </h3>

                      {/* Location */}
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{memory.location.buildingName}</span>
                      </div>
                    </div>
                  </button>
                ))}

                {/* "Add an Entry" card */}
                <button
                  type="button"
                  onClick={() => {
                    onAddMemory?.(selectedDecade);
                    onOpenChange(false);
                  }}
                  className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-sky-200 bg-sky-50/50 transition-colors hover:border-sky-400 hover:bg-sky-50"
                >
                  <Plus className="h-10 w-10 text-sky-400" />
                  <p className="mt-2 text-sm font-medium text-sky-600">
                    Add an Entry
                  </p>
                </button>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4">
                <p className="text-sm text-muted-foreground">
                  No memories found
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onAddMemory?.(selectedDecade);
                    onOpenChange(false);
                  }}
                  className="flex items-center gap-2 rounded-lg border-2 border-dashed border-sky-200 bg-sky-50/50 px-6 py-3 text-sm font-medium text-sky-600 transition-colors hover:border-sky-400 hover:bg-sky-50"
                >
                  <Plus className="h-5 w-5" />
                  Add an Entry
                </button>
              </div>
            )}
          </div>

          {/* ====== Filter Panel (overlay within content area) ====== */}
          <FilterMemoriesModal
            open={filtersOpen}
            onClose={() => setFiltersOpen(false)}
            filters={filters}
            onApply={setFilters}
            availableTags={availableTags}
            availableYears={availableYears}
            availableLocations={availableLocations}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
