'use client';

import { useState } from 'react';
import { Heart, ImageIcon, MessageSquare, Frown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { cn } from '@/lib/utils';
import {
  useUserActivity,
  type ActivityItem,
  type ActivityItemType,
} from '@/lib/hooks/useUserActivity';
import type { MemoryWithCoordinates } from '@/lib/hooks/useAllMemoriesWithCoordinates';

interface ActivityTimelineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | undefined;
  onMemorySelect: (memory: MemoryWithCoordinates) => void;
}

type FilterType = 'all' | ActivityItemType;

const FILTERS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'upload', label: 'Uploads' },
  { value: 'vote', label: 'Votes' },
  { value: 'comment', label: 'Comments' },
];

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

function ActivityRow({
  item,
  onClick,
}: {
  item: ActivityItem;
  onClick: () => void;
}) {
  const Icon =
    item.type === 'upload'
      ? ImageIcon
      : item.type === 'vote'
        ? Heart
        : MessageSquare;

  const label =
    item.type === 'upload'
      ? 'Uploaded a memory'
      : item.type === 'vote'
        ? 'Liked a memory'
        : `Commented: "${item.commentContent?.slice(0, 60) ?? ''}${(item.commentContent?.length ?? 0) > 60 ? '…' : ''}"`;

  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex w-full items-start gap-3 border-2 border-border px-3 py-3',
        'bg-background text-left transition-colors hover:bg-[#fffdf5]',
        !item.memoryAvailable && 'opacity-60'
      )}
    >
      <Icon
        size={15}
        className="mt-0.5 shrink-0 text-muted-foreground"
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <span className="block font-hand text-sm text-foreground">{label}</span>
        <span
          className={cn(
            'block truncate text-xs italic text-muted-foreground',
            !item.memoryAvailable && 'line-through'
          )}
        >
          {item.memory.title}
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="text-xs text-muted-foreground">
          {formatDateTime(item.createdAt)}
        </span>
        <span className="font-hand text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
          {item.memoryAvailable ? 'View →' : 'See why →'}
        </span>
      </div>
    </button>
  );
}

export function ActivityTimelineModal({
  open,
  onOpenChange,
  userId,
  onMemorySelect,
}: ActivityTimelineModalProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [unavailableOpen, setUnavailableOpen] = useState(false);

  const { data, isPending, isError, error } = useUserActivity({
    userId,
    type: activeFilter === 'all' ? undefined : activeFilter,
    limit: 50,
  });

  const items = data?.data ?? [];

  function handleRowClick(item: ActivityItem) {
    if (!item.memoryAvailable) {
      setUnavailableOpen(true);
      return;
    }
    onMemorySelect(item.memory as MemoryWithCoordinates);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="flex max-h-[90vh] max-w-lg flex-col gap-4 rounded-none border-2 border-border shadow-none"
          style={{ borderRadius: 0 }}
        >
          <DialogHeader>
            <DialogTitle className="font-kalam text-xl">
              Activity Timeline
            </DialogTitle>
          </DialogHeader>

          {/* Filter buttons */}
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setActiveFilter(value)}
                style={{ borderRadius: 0 }}
                className={cn(
                  'border-2 border-foreground px-3 py-1 font-hand text-xs uppercase tracking-[0.14em]',
                  'transition-colors',
                  activeFilter === value
                    ? 'bg-[#fff4a8] text-foreground'
                    : 'bg-background text-foreground hover:bg-[#fffdf5]'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Activity list */}
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
            {isPending &&
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse border-2 border-border bg-muted/60"
                />
              ))}

            {isError && (
              <p className="font-hand text-sm text-red-500">
                {error instanceof Error
                  ? error.message
                  : 'Failed to load activity. Please try again.'}
              </p>
            )}

            {!isPending && !isError && items.length === 0 && (
              <p className="py-6 text-center font-hand text-sm italic text-muted-foreground">
                No activity yet.
              </p>
            )}

            {!isPending &&
              !isError &&
              items.map((item) => (
                <ActivityRow
                  key={`${item.type}-${item.id}`}
                  item={item}
                  onClick={() => handleRowClick(item)}
                />
              ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Memory unavailable dialog */}
      <Dialog open={unavailableOpen} onOpenChange={setUnavailableOpen}>
        <DialogContent
          className="max-w-sm rounded-none border-2 border-border text-center shadow-none"
          style={{ borderRadius: 0 }}
        >
          <div className="flex flex-col items-center gap-3 py-4">
            <Frown
              size={48}
              className="text-muted-foreground"
              strokeWidth={1.5}
            />
            <DialogTitle className="font-kalam text-lg">Uh oh!</DialogTitle>
            <p className="font-hand text-sm text-muted-foreground">
              It looks like this memory is no longer available — it may have
              been removed or its visibility was restricted.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
