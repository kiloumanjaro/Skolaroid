'use client';

import { useState, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// =============================================================================
// TYPES
// =============================================================================

export type SortOption =
  | 'date-newest'
  | 'date-oldest'
  | 'upvotes-high'
  | 'upvotes-low';

export type VisibilityFilter =
  | 'ALL'
  | 'PUBLIC'
  | 'BATCH_ONLY'
  | 'PROGRAM_ONLY'
  | 'GROUP_ONLY';

export interface MemoryFilters {
  sortBy: SortOption;
  visibility: VisibilityFilter;
  selectedTags: string[];
  selectedYear: number | null;
}

export const DEFAULT_FILTERS: MemoryFilters = {
  sortBy: 'date-newest',
  visibility: 'ALL',
  selectedTags: [],
  selectedYear: null,
};

interface FilterMemoriesModalProps {
  open: boolean;
  onClose: () => void;
  filters: MemoryFilters;
  onApply: (filters: MemoryFilters) => void;
  /** Unique tag names extracted from the current memory set */
  availableTags: string[];
  /** Unique years extracted from the current memory set */
  availableYears: number[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'date-newest', label: 'Date (Newest)' },
  { value: 'date-oldest', label: 'Date (Oldest)' },
  { value: 'upvotes-high', label: 'Upvotes (High)' },
  { value: 'upvotes-low', label: 'Upvotes (Low)' },
];

const VISIBILITY_OPTIONS: { value: VisibilityFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PUBLIC', label: 'Public' },
  { value: 'BATCH_ONLY', label: 'Batch Only' },
  { value: 'PROGRAM_ONLY', label: 'Program Only' },
  { value: 'GROUP_ONLY', label: 'Group Only' },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function FilterMemoriesModal({
  open,
  onClose,
  filters,
  onApply,
  availableTags,
  availableYears,
}: FilterMemoriesModalProps) {
  const [draft, setDraft] = useState<MemoryFilters>(filters);

  useEffect(() => {
    if (open) {
      setDraft(filters);
    }
  }, [open, filters]);

  const handleClearAll = useCallback(() => {
    setDraft(DEFAULT_FILTERS);
  }, []);

  const handleApply = useCallback(() => {
    onApply(draft);
    onClose();
  }, [draft, onApply, onClose]);

  const toggleTag = useCallback((tag: string) => {
    setDraft((prev) => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter((t) => t !== tag)
        : [...prev.selectedTags, tag],
    }));
  }, []);

  const toggleYear = useCallback((year: number) => {
    setDraft((prev) => ({
      ...prev,
      selectedYear: prev.selectedYear === year ? null : year,
    }));
  }, []);

  return (
    <div
      className={cn(
        'absolute right-0 top-0 z-30 flex h-full w-full max-w-[288px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out',
        open ? 'translate-x-0' : 'pointer-events-none translate-x-full'
      )}
      aria-hidden={!open}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-5 py-3">
        <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
        <button
          onClick={onClose}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Close filters"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="scrollbar-hide flex-1 overflow-y-auto px-6 py-4">
        {/* Sort By */}
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Sort By</h3>
          <div className="space-y-1">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  setDraft((prev) => ({ ...prev, sortBy: option.value }))
                }
                className={cn(
                  'w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors',
                  draft.sortBy === option.value
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Visibility */}
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            Visibility
          </h3>
          <div className="space-y-1">
            {VISIBILITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  setDraft((prev) => ({ ...prev, visibility: option.value }))
                }
                className={cn(
                  'w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors',
                  draft.visibility === option.value
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tags (dynamic from loaded memories) */}
        {availableTags.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => {
                const isSelected = draft.selectedTags.includes(tag);
                return (
                  <Badge
                    key={tag}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleTag(tag)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleTag(tag);
                      }
                    }}
                    className={cn(
                      'cursor-pointer select-none rounded-full px-3 py-1.5 text-sm transition-colors',
                      isSelected
                        ? 'border-gray-900 bg-gray-900 text-white hover:bg-gray-800'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
                    )}
                    variant="outline"
                  >
                    #{tag}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Year (dynamic from loaded memories) */}
        {availableYears.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Year</h3>
            <div className="flex flex-wrap gap-2">
              {availableYears.map((year) => {
                const isSelected = draft.selectedYear === year;
                return (
                  <Badge
                    key={year}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleYear(year)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleYear(year);
                      }
                    }}
                    className={cn(
                      'cursor-pointer select-none rounded-full px-3 py-1.5 text-sm transition-colors',
                      isSelected
                        ? 'border-gray-900 bg-gray-900 text-white hover:bg-gray-800'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
                    )}
                    variant="outline"
                  >
                    {year}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-3 border-t px-6 py-4">
        <Button variant="outline" className="flex-1" onClick={handleClearAll}>
          Clear All
        </Button>
        <Button
          className="flex-1 bg-gray-900 text-white hover:bg-gray-800"
          onClick={handleApply}
        >
          Apply
        </Button>
      </div>
    </div>
  );
}
