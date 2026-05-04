'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn, getEraFromBatchTag } from '@/lib/utils';
import { getPrimaryMemoryMediaURL } from '@/lib/memory-media';
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

  useEffect(() => {
    if (!open) return;

    setSelectedDecade(activeMapEra);
    setSearchQuery('');
  }, [activeMapEra, open]);

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
        className="flex h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] max-w-none flex-col gap-0 overflow-hidden rounded-none border-2 border-[#1f1f1f] p-0 shadow-none sm:max-w-none md:h-[85vh] md:w-[70vw] md:max-w-5xl"
        style={{ borderRadius: 0 }}
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Batches</DialogTitle>

        <div className="flex items-center justify-between gap-3 border-b-2 border-b-black bg-[#4384dc] px-3 py-2 text-white">
          <div className="min-w-0">
            <p className="truncate text-base font-medium tracking-[0.01em] sm:text-lg">
              Batches Window
            </p>
          </div>

          <button
            type="button"
            aria-label="Close batches modal"
            onClick={handleClose}
            className="grid h-7 w-7 shrink-0 place-items-center border-2 border-black bg-[#f7d6d5] text-[#7a1111] shadow-[inset_1px_1px_0_#fff8f7,inset_-1px_-1px_0_#c68787]"
          >
            <X className="h-4 w-4 stroke-[2]" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* ====== Sidebar ====== */}
          <div className="flex w-full shrink-0 flex-col border-b-2 border-black bg-[#f0eeec] md:w-56 md:border-b-0 md:border-r-2">
            {/* Decade List */}
            <div className="scrollbar-hide flex-1 overflow-x-auto overflow-y-hidden md:overflow-y-auto">
              <div className="flex gap-0 md:block md:space-y-0">
                {DECADES.map((decade, index) => {
                  const isSelected = selectedDecade === decade.value;
                  const isFirstTab = index === 0;
                  const isLastTab = index === DECADES.length - 1;
                  const activeTabBorderClassName = isFirstTab
                    ? 'border-r-2 border-r-black md:border-r-0'
                    : isLastTab
                      ? 'border-l-2 border-l-black md:border-l-0'
                      : 'border-l-2 border-r-2 border-l-black border-r-black md:border-l-0 md:border-r-0';

                  return (
                    <button
                      key={decade.label}
                      onClick={() => setSelectedDecade(decade.value)}
                      className={cn(
                        'flex shrink-0 appearance-none items-center gap-2 whitespace-nowrap border-0 px-4 py-3 text-left text-sm font-medium transition-colors md:w-full',
                        isSelected
                          ? `${activeTabBorderClassName} bg-[#f6cb48] text-black md:border-b-2 md:border-t-2 md:border-black`
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      )}
                      style={
                        isFirstTab
                          ? { borderTopColor: 'transparent' }
                          : undefined
                      }
                    >
                      <span>{decade.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ====== Content Area ====== */}
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            {/* Memory Cards Grid */}
            <div className="scrollbar-hide flex-1 overflow-y-auto p-4 md:p-5">
              {displayedMemories.length > 0 && (
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search landmarks..."
                      className="w-full border-2 border-black bg-card py-2 pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:border-black focus:outline-none focus:ring-1 focus:ring-skolaroid-blue"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {displayedMemories.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {displayedMemories.map((memory) => (
                    <button
                      key={memory.id}
                      type="button"
                      onClick={() => handleMemoryCardClick(memory)}
                      className="cursor-pointer overflow-hidden border-2 border-border bg-card text-left transition-colors hover:bg-secondary/40"
                    >
                      {(() => {
                        const primaryMediaURL =
                          getPrimaryMemoryMediaURL(memory);

                        return primaryMediaURL ? (
                          <div className="h-44 w-full overflow-hidden bg-secondary">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={
                                primaryMediaURL === '/temporary_map.png'
                                  ? '/assets/images/temporary_map.png'
                                  : primaryMediaURL
                              }
                              alt={memory.title}
                              className="block h-full w-full object-cover object-center"
                            />
                          </div>
                        ) : (
                          <div className="flex h-44 items-center justify-center bg-secondary">
                            <span className="text-sm text-muted-foreground">
                              No image
                            </span>
                          </div>
                        );
                      })()}

                      {/* Info */}
                      <div className="border-t-2 border-border px-3 py-3">
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
                    className="flex h-full min-h-[280px] flex-col items-center justify-center border-[3px] border-dashed border-black bg-[#f0eeec] transition-colors hover:border-black hover:bg-[#f0eeec]"
                  >
                    <Plus className="h-10 w-10 text-black" />
                    <p className="mt-2 text-sm font-medium text-black">
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
                    className="flex items-center gap-2 border-2 border-dashed border-black bg-[#f0eeec] px-6 py-3 text-sm font-medium text-black transition-colors hover:border-black hover:bg-[#f0eeec]"
                  >
                    <Plus className="h-5 w-5" />
                    Add an Entry
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
