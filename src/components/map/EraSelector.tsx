'use client';

import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const ERAS = [
  { decade: 2020, label: '2020s' },
  { decade: 2010, label: '2010s' },
  { decade: 2000, label: '2000s' },
  { decade: 1990, label: '1990s' },
] as const;

interface EraSelectorProps {
  activeEra: number | null;
  onEraSelect: (era: number) => void;
}

export function EraSelector({ activeEra, onEraSelect }: EraSelectorProps) {
  const label = activeEra ? `${activeEra}s` : '2020s';

  return (
    <div className="absolute bottom-10 right-[4.5rem] z-30 sm:bottom-14 sm:right-24">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Current era: ${label}. Click to change.`}
            className="group relative flex h-10 items-center gap-1 overflow-hidden border-2 border-border px-2 transition-all hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] sm:h-14 sm:gap-1.5 sm:border-[3px] sm:px-3"
          >
            <div className="absolute inset-0 bg-card transition-all group-hover:bg-[#f6cb48] group-active:bg-[#f6cb48] group-data-[state=open]:bg-[#f6cb48]" />
            <span className="relative flex items-center gap-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/oblation_icon.svg"
                alt=""
                aria-hidden="true"
                className="h-4 w-auto shrink-0 sm:h-6"
              />
              <span className="font-hand text-xs font-semibold text-foreground sm:text-sm">
                {label}
              </span>
              <ChevronDown className="h-3 w-3 shrink-0 text-foreground sm:h-4 sm:w-4" />
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="start"
          sideOffset={8}
          className="min-w-[7rem] rounded-none border-[3px] border-border bg-card p-0 shadow-[2px_2px_0px_0px_#2d2d2d]"
        >
          {ERAS.map((era) => (
            <DropdownMenuItem
              key={era.decade}
              onSelect={() => onEraSelect(era.decade)}
              className={cn(
                'cursor-pointer rounded-none px-3 py-2.5 font-hand text-sm font-semibold text-foreground focus:bg-[#f6cb48] focus:text-foreground',
                activeEra === era.decade && 'bg-[#f6cb48]'
              )}
            >
              {era.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
