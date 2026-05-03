'use client';

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
  searchQuery: string;
}

export const DEFAULT_FILTERS: MemoryFilters = {
  sortBy: 'date-newest',
  visibility: 'ALL',
  selectedTags: [],
  selectedYear: null,
  selectedGroupId: null,
  selectedLocationId: null,
  searchQuery: '',
};

export interface GroupFilterOption {
  id: string;
  name: string;
}

export interface LocationFilterOption {
  id: string;
  name: string;
}
