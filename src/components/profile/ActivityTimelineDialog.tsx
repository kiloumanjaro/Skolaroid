'use client';

import { useState } from 'react';
import { Heart, ImageIcon, MessageSquare } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { WOBBLY_RADIUS } from '@/lib/hand-drawn';
import {
  useUserActivity,
  type ActivityItem,
  type ActivityItemType,
} from '@/lib/hooks/useUserActivity';
import type { MemoryWithCoordinates } from '@/lib/hooks/useAllMemoriesWithCoordinates';

interface ActivityTimelineDialogProps {
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
      style={{ borderRadius: WOBBLY_RADIUS }}
      className={cn(
        'group flex w-full items-start gap-3 border border-border/40 px-3 py-2',
        'bg-background text-left transition-colors hover:bg-muted'
      )}
    >
      <Icon
        size={15}
        className="mt-0.5 shrink-0 text-muted-foreground"
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <span className="block font-hand text-sm text-foreground">{label}</span>
        <span className="block truncate text-xs italic text-muted-foreground">
          {item.memory.title}
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="text-xs text-muted-foreground">
          {formatDateTime(item.createdAt)}
        </span>
        <span className="font-hand text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
          View →
        </span>
      </div>
    </button>
  );
}

export function ActivityTimelineDialog({
  open,
  onOpenChange,
  userId,
  onMemorySelect,
}: ActivityTimelineDialogProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const { data, isPending, isError, error } = useUserActivity({
    userId,
    type: activeFilter === 'all' ? undefined : activeFilter,
    limit: 50,
  });

  const items = data?.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-lg flex-col gap-4">
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
              style={{ borderRadius: WOBBLY_RADIUS }}
              className={cn(
                'border-2 border-foreground px-3 py-1 font-hand text-xs capitalize',
                'transition-all',
                activeFilter === value
                  ? 'bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_#2d2d2d]'
                  : 'bg-background text-foreground shadow-[3px_3px_0px_0px_#2d2d2d] hover:bg-muted'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Activity list */}
        <div className="flex flex-col gap-2 overflow-y-auto pr-1">
          {isPending &&
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-md bg-muted" />
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
                onClick={() =>
                  onMemorySelect(item.memory as MemoryWithCoordinates)
                }
              />
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
