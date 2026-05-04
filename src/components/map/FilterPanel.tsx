'use client';

import { X, RotateCcw, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  type MemoryFilters,
  type SortOption,
  type VisibilityFilter,
  type GroupFilterOption,
  type LocationFilterOption,
  DEFAULT_FILTERS,
} from './filter-memory-types';

interface FilterPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: MemoryFilters;
  onFiltersChange: (filters: MemoryFilters) => void;
  availableTags: string[];
  availableYears: number[];
  availableGroups: GroupFilterOption[];
  availableLocations: LocationFilterOption[];
}

/** Distance from the bottom of the viewport when the panel is open. */
const OPEN_BOTTOM_GAP = '3rem';

/** Max options shown in the Year, Group, and Location dropdowns. */
const MAX_DROPDOWN_OPTIONS = 5;

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'date-newest', label: 'Newest' },
  { value: 'date-oldest', label: 'Oldest' },
  { value: 'upvotes-high', label: 'Most upvoted' },
  { value: 'upvotes-low', label: 'Least upvoted' },
];

const VISIBILITY_OPTIONS: { value: VisibilityFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PUBLIC', label: 'Public' },
  { value: 'BATCH_ONLY', label: 'Batch' },
  { value: 'PROGRAM_ONLY', label: 'Program' },
  { value: 'GROUP_ONLY', label: 'Group' },
];

export function FilterPanel({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  availableTags,
  availableYears,
  availableGroups,
  availableLocations,
}: FilterPanelProps) {
  const update = <K extends keyof MemoryFilters>(
    key: K,
    value: MemoryFilters[K]
  ) => onFiltersChange({ ...filters, [key]: value });

  const toggleTag = (tag: string) => {
    const next = filters.selectedTags.includes(tag)
      ? filters.selectedTags.filter((t) => t !== tag)
      : [...filters.selectedTags, tag];
    update('selectedTags', next);
  };

  return (
    <div
      className={cn(
        'pointer-events-none absolute left-1/2 z-20 flex w-fit -translate-x-1/2 justify-center transition-[bottom,transform] duration-300 ease-out',
        open && 'pointer-events-auto'
      )}
      style={{ bottom: open ? OPEN_BOTTOM_GAP : 0 }}
    >
      <section
        aria-label="Memory filters"
        className={cn(
          'pointer-events-auto relative flex max-h-[calc(100vh-4rem)] w-[calc(100vw-1rem)] max-w-none flex-col border-2 border-[#1f1f1f] bg-background p-0 shadow-none transition-transform duration-300 ease-out md:max-h-[85vh] md:w-[70vw]',
          open ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <button
          type="button"
          aria-label={open ? 'Close filters' : 'Open filters'}
          onClick={() => onOpenChange(!open)}
          className="pointer-events-auto absolute -top-[4.5rem] left-4 flex h-[4.5rem] w-10 flex-col items-center justify-start gap-1 border-2 border-b-0 border-[#1f1f1f] bg-[#f6cb48] pt-2 text-black transition-transform duration-200 ease-out"
        >
          <Filter className="h-3 w-3 stroke-[2.5]" aria-hidden />
        </button>
        <div className="flex items-center justify-between gap-3 border-b-2 border-b-black bg-[#f6cb48] px-3 py-2 text-black">
          <p className="truncate text-base font-medium tracking-[0.01em] sm:text-lg">
            Filter Memories
          </p>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              aria-label="Reset filters"
              onClick={(event) => {
                event.stopPropagation();
                onFiltersChange(DEFAULT_FILTERS);
              }}
              className="grid h-7 w-7 shrink-0 place-items-center border-2 border-black bg-white text-black"
            >
              <RotateCcw className="h-4 w-4 stroke-[2]" />
            </button>
            <button
              type="button"
              aria-label="Close filters panel"
              onClick={(event) => {
                event.stopPropagation();
                onOpenChange(false);
              }}
              className="grid h-7 w-7 shrink-0 place-items-center border-2 border-black bg-[#f7d6d5] text-[#7a1111] shadow-[inset_1px_1px_0_#fff8f7,inset_-1px_-1px_0_#c68787]"
            >
              <X className="h-4 w-4 stroke-[2]" />
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-4">
          <FilterSection label="Search">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Search title, description, location, tags..."
                value={filters.searchQuery}
                onChange={(e) => update('searchQuery', e.target.value)}
                className="flex-1"
              />
              <button
                type="button"
                aria-label="Reset filters"
                onClick={() => onFiltersChange(DEFAULT_FILTERS)}
                className="grid h-10 shrink-0 place-items-center border-2 border-black bg-white px-2 text-xs font-medium text-black hover:bg-[#fff3bf]"
              >
                <RotateCcw className="h-4 w-4 stroke-[2]" />
              </button>
            </div>
          </FilterSection>

          <div className="grid gap-5 sm:grid-cols-2">
            <FilterSection label="Sort by">
              <div className="flex flex-wrap gap-2">
                {SORT_OPTIONS.map((opt) => (
                  <SegmentedButton
                    key={opt.value}
                    active={filters.sortBy === opt.value}
                    onClick={() => update('sortBy', opt.value)}
                  >
                    {opt.label}
                  </SegmentedButton>
                ))}
              </div>
            </FilterSection>

            <FilterSection label="Visibility">
              <div className="flex flex-wrap gap-2">
                {VISIBILITY_OPTIONS.map((opt) => (
                  <SegmentedButton
                    key={opt.value}
                    active={filters.visibility === opt.value}
                    onClick={() => update('visibility', opt.value)}
                  >
                    {opt.label}
                  </SegmentedButton>
                ))}
              </div>
            </FilterSection>
          </div>

          <FilterSection label="Tags">
            {availableTags.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tags available yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <SegmentedButton
                    key={tag}
                    active={filters.selectedTags.includes(tag)}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </SegmentedButton>
                ))}
              </div>
            )}
          </FilterSection>

          <div className="grid gap-4 sm:grid-cols-3">
            <FilterSection label="Year">
              <NativeSelect
                value={
                  filters.selectedYear === null
                    ? ''
                    : String(filters.selectedYear)
                }
                onChange={(value) =>
                  update(
                    'selectedYear',
                    value === '' ? null : Number.parseInt(value, 10)
                  )
                }
              >
                <option value="">All years</option>
                {availableYears.slice(0, MAX_DROPDOWN_OPTIONS).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </NativeSelect>
            </FilterSection>

            <FilterSection label="Group">
              <NativeSelect
                value={filters.selectedGroupId ?? ''}
                onChange={(value) =>
                  update('selectedGroupId', value === '' ? null : value)
                }
              >
                <option value="">All groups</option>
                {availableGroups.slice(0, MAX_DROPDOWN_OPTIONS).map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </NativeSelect>
            </FilterSection>

            <FilterSection label="Location">
              <NativeSelect
                value={filters.selectedLocationId ?? ''}
                onChange={(value) =>
                  update('selectedLocationId', value === '' ? null : value)
                }
              >
                <option value="">All locations</option>
                {availableLocations
                  .slice(0, MAX_DROPDOWN_OPTIONS)
                  .map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
              </NativeSelect>
            </FilterSection>
          </div>
        </div>
      </section>
    </div>
  );
}

function FilterSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

function SegmentedButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'border-2 border-black px-3 py-1 text-sm font-medium transition-colors',
        active
          ? 'bg-[#4384dc] text-white'
          : 'bg-white text-black hover:bg-[#fff3bf]'
      )}
    >
      {children}
    </button>
  );
}

function NativeSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full border-2 border-border bg-transparent px-3 py-1 font-hand text-base focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
    >
      {children}
    </select>
  );
}
