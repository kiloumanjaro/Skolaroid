'use client';

import { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Layers,
  SlidersHorizontal,
  Users,
} from 'lucide-react';

interface ExpandableToolbarProps {
  onPrimaryClick?: () => void;
  onBatchesClick?: () => void;
  onConfigureClick?: () => void;
}

export function ExpandableToolbar({
  onPrimaryClick,
  onBatchesClick,
  onConfigureClick,
}: ExpandableToolbarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
      {/* Toolbar Container - contains all buttons */}
      <div className="flex flex-col items-center gap-2 rounded-full border-2 border-border bg-card p-2 shadow-[4px_4px_0px_0px_#2d2d2d] transition-all duration-300 sm:gap-3">
        {/* Primary Blue Button - Always Visible */}
        <button
          onClick={onPrimaryClick}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-skolaroid-blue text-white shadow-[3px_3px_0px_0px_#2d2d2d] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-skolaroid-blue/90 hover:shadow-[1px_1px_0px_0px_#2d2d2d] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none sm:h-12 sm:w-12"
          aria-label="Group"
        >
          <Users size={20} />
        </button>

        {/* Expanded Buttons */}
        {isExpanded && (
          <>
            <button
              onClick={onBatchesClick}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-skolaroid-blue text-white shadow-[3px_3px_0px_0px_#2d2d2d] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-skolaroid-blue/90 hover:shadow-[1px_1px_0px_0px_#2d2d2d] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none sm:h-12 sm:w-12"
              aria-label="Batches"
            >
              <Layers size={20} />
            </button>
            <button
              onClick={onConfigureClick}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-skolaroid-blue text-white shadow-[3px_3px_0px_0px_#2d2d2d] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-skolaroid-blue/90 hover:shadow-[1px_1px_0px_0px_#2d2d2d] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none sm:h-12 sm:w-12"
              aria-label="Configure"
            >
              <SlidersHorizontal size={20} />
            </button>
          </>
        )}

        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary transition-all sm:h-12 sm:w-12"
          aria-label={isExpanded ? 'Collapse toolbar' : 'Expand toolbar'}
        >
          {isExpanded ? (
            <ChevronUp size={20} className="text-skolaroid-blue" />
          ) : (
            <ChevronDown size={20} className="text-skolaroid-blue" />
          )}
        </button>
      </div>
    </div>
  );
}
