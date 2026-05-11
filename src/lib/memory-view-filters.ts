import type { MemoryWithCoordinates } from '@/lib/hooks/useAllMemoriesWithCoordinates';
import { getEraFromBatchTag } from '@/lib/utils';
import {
  DEFAULT_FILTERS,
  type MemoryFilters,
  type SortOption,
  type VisibilityFilter,
} from '@/components/map/filter-memory-types';

type SearchParamsReader = {
  get(name: string): string | null;
};

const SORT_OPTIONS = new Set<SortOption>([
  'date-newest',
  'date-oldest',
  'upvotes-high',
  'upvotes-low',
]);

const VISIBILITY_OPTIONS = new Set<VisibilityFilter>([
  'ALL',
  'PUBLIC',
  'BATCH_ONLY',
  'PROGRAM_ONLY',
  'GROUP_ONLY',
]);

function parsePositiveInt(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function readEraFromSearchParams(
  searchParams: SearchParamsReader,
  fallback = 2020
): number {
  return parsePositiveInt(searchParams.get('era')) ?? fallback;
}

export function readMemoryFiltersFromSearchParams(
  searchParams: SearchParamsReader
): MemoryFilters {
  const sortBy = searchParams.get('sort');
  const visibility = searchParams.get('visibility');
  const tags = searchParams.get('tags');
  const selectedYear = parsePositiveInt(searchParams.get('year'));

  return {
    sortBy: SORT_OPTIONS.has(sortBy as SortOption)
      ? (sortBy as SortOption)
      : DEFAULT_FILTERS.sortBy,
    visibility: VISIBILITY_OPTIONS.has(visibility as VisibilityFilter)
      ? (visibility as VisibilityFilter)
      : DEFAULT_FILTERS.visibility,
    selectedTags: tags
      ? tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
      : DEFAULT_FILTERS.selectedTags,
    selectedYear,
    selectedGroupId: searchParams.get('groupId') || null,
    selectedLocationId: searchParams.get('locationId') || null,
    searchQuery: searchParams.get('q') ?? DEFAULT_FILTERS.searchQuery,
  };
}

export function writeMemoryFiltersToSearchParams(
  searchParams: URLSearchParams,
  filters: MemoryFilters
) {
  if (filters.sortBy === DEFAULT_FILTERS.sortBy) searchParams.delete('sort');
  else searchParams.set('sort', filters.sortBy);

  if (filters.visibility === DEFAULT_FILTERS.visibility) {
    searchParams.delete('visibility');
  } else {
    searchParams.set('visibility', filters.visibility);
  }

  if (filters.selectedTags.length === 0) searchParams.delete('tags');
  else searchParams.set('tags', filters.selectedTags.join(','));

  if (filters.selectedYear == null) searchParams.delete('year');
  else searchParams.set('year', String(filters.selectedYear));

  if (!filters.selectedGroupId) searchParams.delete('groupId');
  else searchParams.set('groupId', filters.selectedGroupId);

  if (!filters.selectedLocationId) searchParams.delete('locationId');
  else searchParams.set('locationId', filters.selectedLocationId);

  if (!filters.searchQuery.trim()) searchParams.delete('q');
  else searchParams.set('q', filters.searchQuery);
}

export function copyMemoryViewSearchParams(
  searchParams: SearchParamsReader
): URLSearchParams {
  const next = new URLSearchParams();
  next.set('era', String(readEraFromSearchParams(searchParams)));
  writeMemoryFiltersToSearchParams(
    next,
    readMemoryFiltersFromSearchParams(searchParams)
  );
  return next;
}

export function filterMemoriesByEra(
  memories: MemoryWithCoordinates[],
  era: number
): MemoryWithCoordinates[] {
  return memories.filter((memory) => {
    if (
      memory.moderationStatus === 'REJECTED' ||
      memory.moderationStatus === 'REMOVED'
    ) {
      return false;
    }

    return getEraFromBatchTag(memory.tags ?? [], memory.createdAt) === era;
  });
}

export function applyMemoryFilters(
  memories: MemoryWithCoordinates[],
  filters: MemoryFilters
): MemoryWithCoordinates[] {
  return memories.filter((memory) => {
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase().trim();
      const inTitle = (memory.title ?? '').toLowerCase().includes(query);
      const inDesc = (memory.description ?? '').toLowerCase().includes(query);
      const inLocation = (
        (memory.location as { buildingName?: string } | undefined)
          ?.buildingName ?? ''
      )
        .toLowerCase()
        .includes(query);
      const inTags = (memory.tags ?? []).some((tag) =>
        tag.name.toLowerCase().includes(query)
      );

      if (!inTitle && !inDesc && !inLocation && !inTags) return false;
    }

    if (filters.selectedTags.length > 0) {
      const memoryTagNames = memory.tags?.map((tag) => tag.name) ?? [];
      const hasAllTags = filters.selectedTags.every((tag) =>
        memoryTagNames.includes(tag)
      );
      if (!hasAllTags) return false;
    }

    if (filters.selectedYear) {
      const memoryDateValue = (memory as { memoryDate?: string }).memoryDate;
      const memoryYear = memoryDateValue
        ? new Date(memoryDateValue).getFullYear()
        : new Date(memory.createdAt ?? Date.now()).getFullYear();
      if (memoryYear !== filters.selectedYear) return false;
    }

    if (
      filters.visibility !== DEFAULT_FILTERS.visibility &&
      memory.visibility !== filters.visibility
    ) {
      return false;
    }

    if (
      filters.selectedGroupId &&
      memory.privateGroupId !== filters.selectedGroupId
    ) {
      return false;
    }

    if (filters.selectedLocationId) {
      const locationId = (memory.location as { id?: string } | undefined)?.id;
      if (locationId !== filters.selectedLocationId) return false;
    }

    return true;
  });
}

export function sortMemories(
  memories: MemoryWithCoordinates[],
  sortBy: SortOption
): MemoryWithCoordinates[] {
  const sorted = [...memories];

  switch (sortBy) {
    case 'date-newest':
      return sorted.sort((a, b) => {
        const aDate = new Date(a.createdAt ?? Date.now()).getTime();
        const bDate = new Date(b.createdAt ?? Date.now()).getTime();
        return bDate - aDate;
      });
    case 'date-oldest':
      return sorted.sort((a, b) => {
        const aDate = new Date(a.createdAt ?? Date.now()).getTime();
        const bDate = new Date(b.createdAt ?? Date.now()).getTime();
        return aDate - bDate;
      });
    case 'upvotes-high':
    case 'upvotes-low':
    default:
      return sorted;
  }
}
