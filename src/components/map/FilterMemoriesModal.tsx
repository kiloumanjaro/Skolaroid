'use client';

import { useState, useCallback, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ColorStrip } from '@/components/ui/color-strip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LocationCombobox } from '@/components/ui/location-combobox';
import { WOBBLY_RADIUS, WOBBLY_RADIUS_MD } from '@/lib/hand-drawn';

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
  selectedGroupId: string | null;
  selectedLocationId: string | null;
}

export const DEFAULT_FILTERS: MemoryFilters = {
  sortBy: 'date-newest',
  visibility: 'ALL',
  selectedTags: [],
  selectedYear: null,
  selectedGroupId: null,
  selectedLocationId: null,
};

export interface GroupFilterOption {
  id: string;
  name: string;
}

export interface LocationFilterOption {
  id: string;
  name: string;
}

interface FilterMemoriesModalProps {
  open: boolean;
  onClose: () => void;
  filters: MemoryFilters;
  onApply: (filters: MemoryFilters) => void;
  availableTags: string[];
  availableYears: number[];
  availableGroups?: GroupFilterOption[];
  availableLocations?: LocationFilterOption[];
  showColorStrip?: boolean;
}

interface FilterMemoriesPanelProps {
  active?: boolean;
  onClose?: () => void;
  filters: MemoryFilters;
  onApply: (filters: MemoryFilters) => void;
  availableTags: string[];
  availableYears: number[];
  availableGroups?: GroupFilterOption[];
  availableLocations?: LocationFilterOption[];
  className?: string;
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

const SELECT_TRIGGER_CLASSNAME = cn(
  'flex w-full items-center justify-between border-2 border-border bg-card',
  'px-3 py-2 font-hand text-sm text-foreground',
  'shadow-[4px_4px_0px_0px_#2d2d2d]',
  'hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#2d2d2d]',
  'active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
  'transition-all'
);

const SELECT_CONTENT_CLASSNAME =
  'w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] border-2 border-border bg-card p-1 shadow-[4px_4px_0px_0px_#2d2d2d]';

const SELECT_ITEM_CLASSNAME = cn(
  'font-hand text-sm text-foreground',
  'focus:bg-secondary focus:text-foreground',
  'data-[state=checked]:bg-foreground data-[state=checked]:text-background'
);

// =============================================================================
// COMPONENT
// =============================================================================

export function FilterMemoriesPanel({
  active = true,
  onClose,
  filters,
  onApply,
  availableTags,
  availableYears,
  availableGroups = [],
  availableLocations = [],
  className,
}: FilterMemoriesPanelProps) {
  const [draft, setDraft] = useState<MemoryFilters>(filters);

  useEffect(() => {
    if (active) {
      setDraft(filters);
    }
  }, [active, filters]);

  const handleClearAll = useCallback(() => {
    setDraft(DEFAULT_FILTERS);
  }, []);

  const handleApply = useCallback(() => {
    onApply(draft);
    onClose?.();
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
      className={cn('flex h-full flex-col overflow-hidden bg-card', className)}
    >
      <div className="flex items-center justify-between border-b px-5 py-3">
        <h2 className="text-sm font-semibold text-foreground">Filters</h2>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close filters"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="scrollbar-hide flex-1 overflow-y-auto px-6 py-4">
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            Sort By
          </h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={SELECT_TRIGGER_CLASSNAME}
                style={{ borderRadius: WOBBLY_RADIUS }}
              >
                <span>
                  {SORT_OPTIONS.find((option) => option.value === draft.sortBy)
                    ?.label ?? 'Sort'}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className={SELECT_CONTENT_CLASSNAME}
              style={{ borderRadius: WOBBLY_RADIUS_MD }}
              sideOffset={6}
            >
              <DropdownMenuRadioGroup
                value={draft.sortBy}
                onValueChange={(value) =>
                  setDraft((prev) => ({ ...prev, sortBy: value as SortOption }))
                }
              >
                {SORT_OPTIONS.map((option) => (
                  <DropdownMenuRadioItem
                    key={option.value}
                    value={option.value}
                    className={SELECT_ITEM_CLASSNAME}
                  >
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mb-6">
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            Visibility
          </h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={SELECT_TRIGGER_CLASSNAME}
                style={{ borderRadius: WOBBLY_RADIUS }}
              >
                <span>
                  {VISIBILITY_OPTIONS.find(
                    (option) => option.value === draft.visibility
                  )?.label ?? 'Visibility'}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className={SELECT_CONTENT_CLASSNAME}
              style={{ borderRadius: WOBBLY_RADIUS_MD }}
              sideOffset={6}
            >
              <DropdownMenuRadioGroup
                value={draft.visibility}
                onValueChange={(value) =>
                  setDraft((prev) => ({
                    ...prev,
                    visibility: value as VisibilityFilter,
                  }))
                }
              >
                {VISIBILITY_OPTIONS.map((option) => (
                  <DropdownMenuRadioItem
                    key={option.value}
                    value={option.value}
                    className={SELECT_ITEM_CLASSNAME}
                  >
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {availableGroups.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Group
            </h3>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() =>
                  setDraft((prev) => ({ ...prev, selectedGroupId: null }))
                }
                className={cn(
                  'w-full px-4 py-3 text-left text-sm font-medium transition-colors',
                  draft.selectedGroupId === null
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:bg-secondary'
                )}
              >
                All My Groups
              </button>
              {availableGroups.map((group) => (
                <button
                  type="button"
                  key={group.id}
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      selectedGroupId: group.id,
                      visibility: 'GROUP_ONLY',
                    }))
                  }
                  className={cn(
                    'w-full px-4 py-3 text-left text-sm font-medium transition-colors',
                    draft.selectedGroupId === group.id
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:bg-secondary'
                  )}
                >
                  {group.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {availableLocations.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Location
            </h3>
            <LocationCombobox
              options={availableLocations.map((location) => ({
                id: location.id,
                label: location.name,
              }))}
              value={draft.selectedLocationId}
              onChange={(id) =>
                setDraft((prev) => ({ ...prev, selectedLocationId: id }))
              }
              placeholder="Search location..."
            />
          </div>
        )}

        {availableTags.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => {
                const isSelected = draft.selectedTags.includes(tag);
                return (
                  <Badge
                    key={tag}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleTag(tag)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        toggleTag(tag);
                      }
                    }}
                    className={cn(
                      'cursor-pointer select-none rounded-full px-3 py-1.5 text-sm transition-colors',
                      isSelected
                        ? 'border-foreground bg-foreground text-background hover:bg-foreground/90'
                        : 'border-border bg-card text-muted-foreground hover:bg-secondary'
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

        {availableYears.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Year</h3>
            <div className="flex flex-wrap gap-2">
              {availableYears.map((year) => {
                const isSelected = draft.selectedYear === year;
                return (
                  <Badge
                    key={year}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleYear(year)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        toggleYear(year);
                      }
                    }}
                    className={cn(
                      'cursor-pointer select-none rounded-full px-3 py-1.5 text-sm transition-colors',
                      isSelected
                        ? 'border-foreground bg-foreground text-background hover:bg-foreground/90'
                        : 'border-border bg-card text-muted-foreground hover:bg-secondary'
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

      <div className="flex gap-3 border-t px-6 py-4">
        <Button variant="outline" className="flex-1" onClick={handleClearAll}>
          Clear All
        </Button>
        <Button
          className="flex-1 bg-foreground text-background hover:bg-foreground/90"
          onClick={handleApply}
        >
          Apply
        </Button>
      </div>
    </div>
  );
}

export function FilterMemoriesModal({
  open,
  onClose,
  filters,
  onApply,
  availableTags,
  availableYears,
  availableGroups = [],
  availableLocations = [],
  showColorStrip = true,
}: FilterMemoriesModalProps) {
  return (
    <div
      className={cn(
        'fixed left-2 top-2 z-30 flex h-[calc(100%-1rem)] transition-all duration-300 ease-in-out sm:left-0 sm:top-0 sm:h-full',
        open ? '' : 'pointer-events-none'
      )}
      aria-hidden={!open}
    >
      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-in-out',
          open
            ? 'w-[calc(100vw-2.5rem)] opacity-100 shadow-[6px_6px_0px_0px_#2d2d2d] sm:w-[288px]'
            : 'w-0 opacity-0'
        )}
      >
        <FilterMemoriesPanel
          active={open}
          onClose={onClose}
          filters={filters}
          onApply={onApply}
          availableTags={availableTags}
          availableYears={availableYears}
          availableGroups={availableGroups}
          availableLocations={availableLocations}
        />
      </div>

      {showColorStrip ? (
        <ColorStrip
          interactive
          onClick={onClose}
          ariaLabel={open ? 'Close filters' : 'Open filters'}
          className={cn(!open && 'pointer-events-auto')}
        />
      ) : null}
    </div>
  );
}
