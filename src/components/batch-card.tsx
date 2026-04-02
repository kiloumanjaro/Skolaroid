'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface BatchCardProps {
  year: number;
  message: string;
  position?: string;
}

export function BatchCard({ year, message, position }: BatchCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const displayYear = year.toString().slice(-2); // Convert 2023 to "23"

  return (
    <div className={cn('relative', position)}>
      {/* Message Bubble - iPhone style */}
      <div
        className={cn(
          'absolute bottom-full left-1/2 z-50 mb-3 -translate-x-1/2 transition-all duration-300 ease-out',
          isHovered
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-2 opacity-0'
        )}
      >
        <div className="relative max-w-xs border-2 border-border bg-primary px-4 py-2.5 text-primary-foreground shadow-[4px_4px_0px_0px_#2d2d2d]">
          <p className="whitespace-nowrap text-sm font-medium">{message}</p>
          {/* Bubble tail */}
          <div className="absolute left-1/2 top-full -mt-px -translate-x-1/2">
            <div className="h-0 w-0 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-primary" />
          </div>
        </div>
      </div>

      {/* Batch Card */}
      <button
        className="pointer-events-auto relative flex h-16 w-16 items-center justify-center rounded-[5px]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        aria-label={`Batch ${year} - ${message}`}
      >
        <div className="absolute left-0 top-0 h-16 w-16 rounded-[5px] border-2 border-border bg-card shadow-[2px_2px_0px_0px_#2d2d2d]" />
        <div className="absolute text-center text-3xl font-medium text-foreground">
          {displayYear}
        </div>
      </button>
    </div>
  );
}
