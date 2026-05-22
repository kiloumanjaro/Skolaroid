'use client';

import { Users, X } from 'lucide-react';
import type { GroupFilterOption } from './filter-memory-types';

interface GroupSelectorProps {
  groups: GroupFilterOption[];
  selectedGroupId: string | null;
  onSelect: (id: string | null) => void;
  onOpenGroups: () => void;
}

export function GroupSelector({
  groups,
  selectedGroupId,
  onSelect,
  onOpenGroups,
}: GroupSelectorProps) {
  const selectedGroup = groups.find((g) => g.id === selectedGroupId);
  const label = selectedGroup ? selectedGroup.name : 'Select group';

  return (
    <div className="relative flex h-10 min-w-[8.5rem] max-w-[16rem] items-center overflow-hidden border-2 border-border bg-card sm:h-14 sm:border-[3px]">
      <button
        type="button"
        aria-label={
          selectedGroup
            ? `Current group: ${label}. Click to manage.`
            : 'Select group'
        }
        onClick={onOpenGroups}
        className="group relative flex h-full min-w-0 flex-1 items-center gap-2 pl-4 pr-3 transition-colors hover:bg-[#f6cb48] active:bg-[#f6cb48] sm:gap-3 sm:pl-5 sm:pr-4"
      >
        <Users
          className="h-4 w-auto shrink-0 text-foreground sm:h-5"
          aria-hidden="true"
        />
        <span className="truncate font-hand text-xs font-semibold text-foreground sm:text-sm">
          {label}
        </span>
      </button>
      {selectedGroup && (
        <button
          type="button"
          aria-label="Clear group selection"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(null);
          }}
          className="grid h-full shrink-0 place-items-center bg-card px-2 hover:bg-[#f6cb48] sm:px-3"
        >
          <X className="h-4 w-4 text-foreground sm:h-5 sm:w-5" />
        </button>
      )}
    </div>
  );
}
