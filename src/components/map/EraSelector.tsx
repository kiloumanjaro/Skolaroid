'use client';

import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
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
            className="group relative flex h-10 min-w-[8.5rem] items-center gap-2 overflow-hidden border-2 border-border pl-4 pr-0 transition-colors sm:h-14 sm:gap-3 sm:border-[3px] sm:pl-5 sm:pr-3"
          >
            <div className="absolute inset-0 bg-card transition-colors group-hover:bg-[#f6cb48] group-active:bg-[#f6cb48] group-data-[state=open]:bg-[#f6cb48]" />
            <span className="relative flex items-center gap-2 sm:gap-3">
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
          {ERAS.map((era) => (
            <DropdownMenuItem
              key={era.decade}
              onSelect={() => onEraSelect(era.decade)}
              className={cn(
                'min-h-8 cursor-pointer rounded-none border border-transparent px-2 py-1.5 font-hand text-sm font-normal text-black hover:font-semibold focus:bg-transparent focus:text-black data-[highlighted]:bg-transparent data-[highlighted]:text-black',
                activeEra === era.decade &&
                  'border-[#2d2d2d] bg-[#fd91e6] font-semibold'
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
