'use client';

import { ChevronDown, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { cn } from '@/lib/utils';
import type { GroupFilterOption } from './filter-memory-types';

interface GroupSelectorProps {
  groups: GroupFilterOption[];
  selectedGroupId: string | null;
  onSelect: (id: string | null) => void;
  onCreateGroup: () => void;
}

export function GroupSelector({
  groups,
  selectedGroupId,
  onSelect,
  onCreateGroup,
}: GroupSelectorProps) {
  const selectedGroup = groups.find((g) => g.id === selectedGroupId);
  const label = selectedGroup ? selectedGroup.name : 'Select group';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Current group: ${label}. Click to change.`}
          className="group relative flex h-10 min-w-[8.5rem] max-w-[12rem] items-center gap-2 overflow-hidden border-2 border-border pl-4 pr-0 transition-colors sm:h-14 sm:gap-3 sm:border-[3px] sm:pl-5 sm:pr-3"
        >
          <div className="absolute inset-0 bg-card transition-colors group-hover:bg-[#f6cb48] group-active:bg-[#f6cb48] group-data-[state=open]:bg-[#f6cb48]" />
          <span className="relative flex min-w-0 items-center gap-2 sm:gap-3">
            <Users
              className="h-4 w-auto shrink-0 text-foreground sm:h-5"
              aria-hidden="true"
            />
            <span className="truncate font-hand text-xs font-semibold text-foreground sm:text-sm">
              {label}
            </span>
            <span className="grid h-4 w-4 shrink-0 place-items-center text-foreground sm:h-5 sm:w-5">
              <ChevronDown className="h-full w-full transition-transform duration-150 group-data-[state=open]:rotate-180" />
            </span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="start"
        sideOffset={8}
        className="w-[var(--radix-dropdown-menu-trigger-width)] rounded-none border-2 border-[#2d2d2d] bg-[#fff4fb] p-0.5 shadow-none"
      >
        {groups.length === 0 ? (
          <DropdownMenuItem
            onSelect={() => onCreateGroup()}
            className="min-h-8 cursor-pointer rounded-none border border-transparent px-2 py-1.5 font-hand text-sm font-normal text-black hover:font-semibold focus:bg-transparent focus:text-black data-[highlighted]:bg-transparent data-[highlighted]:text-black"
          >
            Create a group
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuItem
              onSelect={() => onSelect(null)}
              className={cn(
                'min-h-8 cursor-pointer rounded-none border border-transparent px-2 py-1.5 font-hand text-sm font-normal text-black hover:font-semibold focus:bg-transparent focus:text-black data-[highlighted]:bg-transparent data-[highlighted]:text-black',
                selectedGroupId === null &&
                  'border-[#2d2d2d] bg-[#fd91e6] font-semibold'
              )}
            >
              ----
            </DropdownMenuItem>
            {groups.map((group) => (
              <DropdownMenuItem
                key={group.id}
                onSelect={() => onSelect(group.id)}
                className={cn(
                  'min-h-8 cursor-pointer rounded-none border border-transparent px-2 py-1.5 font-hand text-sm font-normal text-black hover:font-semibold focus:bg-transparent focus:text-black data-[highlighted]:bg-transparent data-[highlighted]:text-black',
                  selectedGroupId === group.id &&
                    'border-[#2d2d2d] bg-[#fd91e6] font-semibold'
                )}
              >
                {group.name}
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
