'use client';

import { Layers, SlidersHorizontal } from 'lucide-react';

interface ExpandableToolbarProps {
  onBatchesClick?: () => void;
  onConfigureClick?: () => void;
}

const toolbarButtonClassName =
  'flex h-11 w-11 items-center justify-center rounded-full bg-skolaroid-blue text-white shadow-[3px_3px_0px_0px_#2d2d2d] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-skolaroid-blue/90 hover:shadow-[1px_1px_0px_0px_#2d2d2d] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none sm:h-12 sm:w-12';

export function ExpandableToolbar({
  onBatchesClick,
  onConfigureClick,
}: ExpandableToolbarProps) {
  return (
    <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
      <div className="flex flex-col items-center gap-2 sm:gap-3">
        <button
          onClick={onBatchesClick}
          className={toolbarButtonClassName}
          aria-label="Batches"
        >
          <Layers size={20} />
        </button>

        {onConfigureClick && (
          <button
            onClick={onConfigureClick}
            className={toolbarButtonClassName}
            aria-label="Configure"
          >
            <SlidersHorizontal size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
