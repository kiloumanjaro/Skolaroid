'use client';

import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn, getEraFromBatchTag } from '@/lib/utils';
import { X, Search, Plus, MapPin } from 'lucide-react';
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

  const allMemories = useMemo<MemoryWithCoordinates[]>(
    () => memoriesProp ?? [],
    [memoriesProp]
  );

  // Filter memories by era (batch tag) and keyword search.
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

    result.sort(
      (a, b) =>
        new Date(b.createdAt ?? '').getTime() -
        new Date(a.createdAt ?? '').getTime()
    );

    return result;
  }, [allMemories, selectedDecade, searchQuery]);

  // Handle clicking a memory card — always delegates to the parent
  const handleMemoryCardClick = (memory: MemoryWithCoordinates) => {
    onMemorySelected?.(memory);
    onOpenChange(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setSearchQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] max-w-none flex-col gap-0 overflow-hidden rounded-none p-0 shadow-none sm:max-w-none md:h-[85vh] md:w-[70vw] md:max-w-5xl md:flex-row"
        style={{ borderRadius: 0 }}
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
          {/* Content Header */}
          <div className="flex items-center justify-end border-b px-4 py-3 md:px-5">
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
                    className="cursor-pointer overflow-hidden border-2 border-border bg-card text-left transition-colors hover:bg-secondary/40"
                  >
                    {/* Image */}
                    {memory.mediaURL ? (
                      <div className="h-44 w-full overflow-hidden bg-secondary">
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
                      <div className="flex h-44 items-center justify-center bg-secondary">
                        <span className="text-sm text-muted-foreground">
                          No image
                        </span>
                      </div>
                    )}

                    {/* Info */}
                    <div className="border-t border-border px-3 py-3">
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
                  className="flex h-full min-h-[280px] flex-col items-center justify-center border-2 border-dashed border-sky-200 bg-sky-50/50 transition-colors hover:border-sky-400 hover:bg-sky-50"
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
                  className="flex items-center gap-2 border-2 border-dashed border-sky-200 bg-sky-50/50 px-6 py-3 text-sm font-medium text-sky-600 transition-colors hover:border-sky-400 hover:bg-sky-50"
                >
                  <Plus className="h-5 w-5" />
                  Add an Entry
                </button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
