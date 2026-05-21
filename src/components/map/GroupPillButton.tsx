'use client';

import { Users } from 'lucide-react';

interface GroupPillButtonProps {
  label: string;
  onClick: () => void;
}

export function GroupPillButton({ label, onClick }: GroupPillButtonProps) {
  return (
    <button
      type="button"
      aria-label={`Current group: ${label}. Click to open groups.`}
      onClick={onClick}
      className="group relative flex h-10 min-w-[8.5rem] max-w-[12rem] items-center gap-2 overflow-hidden border-2 border-border pl-4 pr-3 transition-colors sm:h-14 sm:gap-3 sm:border-[3px] sm:pl-5"
    >
      <div className="absolute inset-0 bg-card transition-colors group-hover:bg-[#f6cb48] group-active:bg-[#f6cb48]" />
      <span className="relative flex min-w-0 items-center gap-2 sm:gap-3">
        <Users
          className="h-4 w-auto shrink-0 text-foreground sm:h-5"
          aria-hidden="true"
        />
        <span className="truncate font-hand text-xs font-semibold text-foreground sm:text-sm">
          {label}
        </span>
      </span>
    </button>
  );
}
