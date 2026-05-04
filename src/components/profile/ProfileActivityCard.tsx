'use client';

import { Heart, ImageIcon, MessageSquare } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { WOBBLY_RADIUS } from '@/lib/hand-drawn';
import {
  useUserActivity,
  type ActivityItem,
} from '@/lib/hooks/useUserActivity';

interface ProfileActivityCardProps {
  userId: string | undefined;
  onShowMore: () => void;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  if (months < 12) return `${months}mo ago`;
  return `${years}y ago`;
}

function PreviewRow({ item }: { item: ActivityItem }) {
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
        : 'Left a comment';

  return (
    <div className="flex items-start gap-2 font-hand text-xs text-foreground">
      <Icon
        size={13}
        className="mt-0.5 shrink-0 text-muted-foreground"
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <span>{label}</span>
        <span className="block truncate italic text-muted-foreground">
          {item.memory.title}
        </span>
      </div>
      <span className="shrink-0 text-muted-foreground">
        {relativeTime(item.createdAt)}
      </span>
    </div>
  );
}

export function ProfileActivityCard({
  userId,
  onShowMore,
}: ProfileActivityCardProps) {
  const { data, isPending, isError } = useUserActivity({ userId, limit: 3 });
  const items = data?.data.slice(0, 3) ?? [];

  return (
    <Card style={{ borderRadius: '1rem' }}>
      <CardHeader className="pb-2">
        <CardTitle className="font-kalam text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {isPending &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 animate-pulse rounded-md bg-muted" />
          ))}

        {isError && (
          <p className="font-hand text-xs italic text-muted-foreground">
            Could not load activity.
          </p>
        )}

        {!isPending && !isError && items.length === 0 && (
          <p className="font-hand text-xs italic text-muted-foreground">
            No activity yet.
          </p>
        )}

        {!isPending &&
          !isError &&
          items.map((item) => (
            <PreviewRow key={`${item.type}-${item.id}`} item={item} />
          ))}

        <button
          onClick={onShowMore}
          style={{ borderRadius: WOBBLY_RADIUS }}
          className={cn(
            'mt-1 w-full py-1 text-center font-hand text-xs text-primary',
            'underline underline-offset-2 transition-colors hover:text-primary/70'
          )}
        >
          Show more →
        </button>
      </CardContent>
    </Card>
  );
}
