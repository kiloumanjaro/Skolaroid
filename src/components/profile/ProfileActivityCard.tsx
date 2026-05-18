'use client';

import { Heart, ImageIcon, MessageSquare } from 'lucide-react';
import {
  ProfilePanel,
  ProfileSkeletonBlock,
} from '@/components/profile/ProfileShell';
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
    <div className="flex items-start gap-3 border-2 border-border bg-[#fffdf5] px-3 py-3">
      <div className="border-2 border-border bg-white p-2 text-foreground">
        <Icon size={14} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <span className="block font-hand text-sm text-foreground">{label}</span>
        <span className="mt-1 block truncate font-hand text-xs italic text-muted-foreground">
          {item.memory.title}
        </span>
      </div>
      <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.14em] text-foreground/55">
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
    <ProfilePanel
      eyebrow=""
      title="Recent Activity"
      description="A quick pulse on the latest things you have done around the archive."
      accentClassName="bg-[#c0f7fe]"
      contentClassName="space-y-3"
    >
      {isPending &&
        Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="space-y-2 border-2 border-border bg-[#fffdf5] p-3"
          >
            <ProfileSkeletonBlock className="h-4 w-2/3 border-0" />
            <ProfileSkeletonBlock className="h-3 w-1/2 border-0" />
          </div>
        ))}

      {isError && (
        <div className="border-2 border-border bg-[#fff8fb] px-4 py-5">
          <p className="font-hand text-sm text-muted-foreground">
            Could not load activity right now.
          </p>
        </div>
      )}

      {!isPending && !isError && items.length === 0 && (
        <div className="border-2 border-dashed border-border bg-[#fffdf5] px-4 py-5">
          <p className="font-hand text-sm italic text-muted-foreground">
            No activity yet.
          </p>
        </div>
      )}

      {!isPending &&
        !isError &&
        items.map((item) => (
          <PreviewRow key={`${item.type}-${item.id}`} item={item} />
        ))}

      <button
        type="button"
        onClick={onShowMore}
        className="w-full border-2 border-border bg-[#fff4a8] px-4 py-3 text-center font-hand text-sm font-semibold text-foreground transition-colors hover:bg-[#ffe978]"
      >
        Open Full Timeline
      </button>
    </ProfilePanel>
  );
}
