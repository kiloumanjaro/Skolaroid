'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, RotateCcw, ChevronDown } from 'lucide-react';
import { FunnelIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/Input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { usePanelOpenEffects } from '@/components/shared/shell/MainShellSidebarAction';
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
  usePanelOpenEffects(open);

  const [btnAnim, setBtnAnim] = useState<
    'idle' | 'bob-open' | 'submerged' | 'bounce-back'
  >('idle');
  const prevOpenRef = useRef(open);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const bounceTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const panelRef = useRef<HTMLElement | null>(null);

  // Synchronously mark button as submerged before paint so there's no flash
  // when the panel closes and the button re-enters the DOM.
  useLayoutEffect(() => {
    if (prevOpenRef.current && !open) {
      setBtnAnim('submerged');
    }
    prevOpenRef.current = open;
  }, [open]);

  // After the panel has finished sliding down, surface the button.
  useEffect(() => {
    if (!open) {
      bounceTimerRef.current = setTimeout(() => {
        setBtnAnim('bounce-back');
        setTimeout(() => setBtnAnim('idle'), 500);
      }, 300);
      return () => clearTimeout(bounceTimerRef.current);
    }
  }, [open]);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const updatePanelLeft = () => {
      const nextLeft = panel.getBoundingClientRect().left;
      panel.style.setProperty('--panel-left', `${nextLeft}px`);
    };

    updatePanelLeft();

    const observer =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(updatePanelLeft)
        : null;

    observer?.observe(panel);
    window.addEventListener('resize', updatePanelLeft);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updatePanelLeft);
    };
  }, []);

  const handleTabClick = () => {
    if (open) {
      onOpenChange(false);
      return;
    }
    setBtnAnim('bob-open');
    clearTimeout(openTimerRef.current);
    openTimerRef.current = setTimeout(() => {
      onOpenChange(true);
      setBtnAnim('submerged');
    }, 400);
  };

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

  const panelContent = (
    <>
      {open && (
        <div
          data-state="open"
          className="fixed inset-0 z-40 bg-[#2d2d2d]/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          onClick={() => onOpenChange(false)}
          aria-hidden="true"
        />
      )}
      <div
        className={cn(
          'pointer-events-none fixed left-1/2 z-[60] flex w-fit -translate-x-1/2 justify-center transition-[bottom,top,transform] duration-300 ease-out',
          open && 'pointer-events-auto',
          open
            ? 'bottom-[5.5rem] sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2'
            : 'bottom-0'
        )}
      >
        <section
          ref={panelRef}
          aria-label="Memory filters"
          className={cn(
            'pointer-events-auto relative flex h-[calc(100vh-5rem)] max-h-[calc(100dvh-11.5rem)] w-[calc(100vw-1rem)] max-w-none flex-col rounded-none border-[2px] border-black bg-background p-0 shadow-none transition-transform duration-300 ease-out sm:max-h-none md:h-[75vh] md:w-[70vw]',
            open ? 'translate-y-0' : 'translate-y-full'
          )}
        >
          <button
            type="button"
            aria-label={open ? 'Close filters' : 'Open filters'}
            onClick={handleTabClick}
            className={cn(
              'pointer-events-auto absolute -top-[4rem] h-[5.5rem] w-12 flex-col items-center justify-start gap-1 border-[2px] border-b-0 border-black bg-[#f6cb48] pt-2 text-black',
              open || btnAnim === 'submerged' ? 'hidden' : 'flex',
              btnAnim === 'bob-open' && 'animate-btn-bob-open',
              btnAnim === 'bounce-back' && 'animate-btn-bounce-back'
            )}
            style={{
              left: 100,
              transform:
                'translateX(max(0px, calc(var(--map-left-offset, 0px) - var(--panel-left, 0px))))',
            }}
          >
            <FunnelIcon
              size={22}
              weight="duotone"
              className="filter-panel-icon mt-1"
              style={{ flexShrink: 0 }}
              aria-hidden
            />
          </button>
          <div className="flex items-center justify-between gap-3 border-b-[2px] border-b-black bg-[#f6cb48] px-3 py-2 text-black">
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

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-3 sm:gap-5 sm:py-4">
            <FilterSection label="Search">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Search title, description, location, tags..."
                  value={filters.searchQuery}
                  onChange={(e) => update('searchQuery', e.target.value)}
                  className="flex-1 !rounded-none border-2 border-black bg-card py-3 pl-5 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:border-black focus:outline-none focus:ring-1 focus:ring-skolaroid-blue"
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
                <FilterDropdown
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
                  options={[
                    { label: 'All years', value: '' },
                    ...availableYears
                      .slice(0, MAX_DROPDOWN_OPTIONS)
                      .map((year) => ({
                        label: String(year),
                        value: String(year),
                      })),
                  ]}
                />
              </FilterSection>

              <FilterSection label="Group">
                <FilterDropdown
                  value={filters.selectedGroupId ?? ''}
                  onChange={(value) =>
                    update('selectedGroupId', value === '' ? null : value)
                  }
                  options={[
                    { label: 'All groups', value: '' },
                    ...availableGroups
                      .slice(0, MAX_DROPDOWN_OPTIONS)
                      .map((group) => ({
                        label: group.name,
                        value: group.id,
                      })),
                  ]}
                />
              </FilterSection>

              <FilterSection label="Location">
                <FilterDropdown
                  value={filters.selectedLocationId ?? ''}
                  onChange={(value) =>
                    update('selectedLocationId', value === '' ? null : value)
                  }
                  options={[
                    { label: 'All locations', value: '' },
                    ...availableLocations
                      .slice(0, MAX_DROPDOWN_OPTIONS)
                      .map((loc) => ({
                        label: loc.name,
                        value: loc.id,
                      })),
                  ]}
                />
              </FilterSection>
            </div>
          </div>
        </section>
      </div>
    </>
  );

  return createPortal(panelContent, document.body);
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

function FilterDropdown({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  const selectedLabel =
    options.find((opt) => opt.value === value)?.label || 'Select...';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="group relative flex h-10 w-full items-center justify-between gap-2 overflow-hidden border-2 border-border pl-4 pr-3 transition-colors hover:bg-[#f6cb48]"
        >
          <span className="relative font-hand text-sm text-foreground">
            {selectedLabel}
          </span>
          <span className="grid h-4 w-4 shrink-0 place-items-center text-foreground">
            <ChevronDown className="h-full w-full transition-transform duration-150 group-data-[state=open]:rotate-180" />
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="bottom"
        align="start"
        className="z-[100] w-[var(--radix-dropdown-menu-trigger-width)] rounded-none border-2 border-[#2d2d2d] bg-[#fff4fb] p-0.5 shadow-none"
      >
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onSelect={() => onChange(opt.value)}
            className={cn(
              'min-h-8 cursor-pointer rounded-none border border-transparent px-2 py-1.5 font-hand text-sm font-normal text-black hover:font-semibold focus:bg-transparent focus:text-black data-[highlighted]:bg-transparent data-[highlighted]:text-black',
              value === opt.value &&
                'border-[#2d2d2d] bg-[#fd91e6] font-semibold'
            )}
          >
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
