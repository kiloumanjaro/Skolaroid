'use client';

import { X, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MemoryList } from '@/components/shared/memory/MemoryList';
import { usePanelOpenEffects } from '@/components/shared/shell/MainShellSidebarAction';
import {
  type Landmark,
  LANDMARK_TYPE_LABELS,
  LANDMARK_TYPE_COLORS,
} from '@/lib/constants/landmarks';
import { Badge } from '@/components/ui/Badge';

interface LandmarkMemoriesPanelProps {
  landmark: Landmark | null;
  memoryCount: number;
  onClose: () => void;
}

/**
 * Slide-in side panel that displays the memory list for a selected landmark.
 * Overlaid on the right side of the map without using a Dialog overlay
 * so the map remains interactive.
 */
export function LandmarkMemoriesPanel({
  landmark,
  memoryCount,
  onClose,
}: LandmarkMemoriesPanelProps) {
  const open = !!landmark;
  usePanelOpenEffects(open);

  return (
    <>
      {open && (
        <div
          data-state="open"
          className="fixed inset-0 z-50 bg-[#2d2d2d]/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        className={cn(
          'absolute right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-card shadow-[6px_6px_0px_0px_#2d2d2d] transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
        aria-hidden={!open}
      >
        {landmark && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b px-4 py-3">
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <h2 className="truncate text-base font-semibold leading-tight">
                    {landmark.name}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-xs text-white',
                      LANDMARK_TYPE_COLORS[landmark.type]
                    )}
                  >
                    {LANDMARK_TYPE_LABELS[landmark.type]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {memoryCount} {memoryCount === 1 ? 'memory' : 'memories'}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="mt-0.5 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Close panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Memory list (scrollable) */}
            <div className="scrollbar-hide flex-1 overflow-y-auto">
              <MemoryList
                locationId={landmark.id}
                locationName={landmark.name}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
}
