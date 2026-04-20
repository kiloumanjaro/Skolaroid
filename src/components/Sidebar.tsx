'use client';

import type { MouseEventHandler, ReactNode, RefObject } from 'react';
import { ColorStrip } from '@/components/ui/color-strip';
import { cn } from '@/lib/utils';

interface SidebarProps {
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  children?: ReactNode;
  isDragging?: boolean;
  onMouseDown?: MouseEventHandler<HTMLDivElement>;
  drawerContentRef?: RefObject<HTMLDivElement | null>;
  className?: string;
  contentClassName?: string;
  expandedWidthClassName?: string;
  collapsedWidthClassName?: string;
  stripAriaLabel?: string;
  expandOnHover?: boolean;
  stripTucked?: boolean;
  stripDisabled?: boolean;
}

export function Sidebar({
  drawerOpen,
  setDrawerOpen,
  children,
  isDragging = false,
  onMouseDown,
  drawerContentRef,
  className,
  contentClassName,
  expandedWidthClassName = 'w-[600px]',
  collapsedWidthClassName = 'w-2.5',
  stripAriaLabel = 'Expand drawer',
  expandOnHover = true,
  stripTucked = false,
  stripDisabled = false,
}: SidebarProps) {
  return (
    <div
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen transition-[width,transform] duration-300 ease-in-out',
        drawerOpen ? expandedWidthClassName : collapsedWidthClassName,
        stripTucked ? '-translate-x-full' : 'translate-x-0',
        className
      )}
    >
      <div
        ref={drawerContentRef}
        onMouseDown={onMouseDown}
        className={cn(
          'scrollbar-hide h-full bg-card transition-all duration-300 ease-in-out',
          drawerOpen ? 'w-[calc(100%-10px)] opacity-100' : 'w-0 opacity-0',
          onMouseDown &&
            (isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'),
          contentClassName ?? 'overflow-y-auto'
        )}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {drawerOpen ? children : null}
      </div>

      <button
        type="button"
        onClick={() => setDrawerOpen(!drawerOpen)}
        onMouseEnter={
          expandOnHover && !stripDisabled
            ? () => setDrawerOpen(true)
            : undefined
        }
        disabled={stripDisabled}
        className={cn(
          'h-full w-2.5 shrink-0 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skolaroid-blue/40 disabled:cursor-default disabled:hover:opacity-100',
          stripDisabled && 'pointer-events-none'
        )}
        aria-label={stripAriaLabel}
      >
        <ColorStrip className="h-full" />
      </button>
    </div>
  );
}
