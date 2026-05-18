'use client';

import Image from 'next/image';
import { Heart, ImageOff, MapPin, MessageSquare } from 'lucide-react';
import { useMemoriesByCreator } from '@/lib/hooks/useMemoriesByCreator';
import { getPrimaryMemoryMediaURL } from '@/lib/memory-media';
import { VISIBILITY_LABELS, type MemoryWithRelations } from '@/lib/schemas';
import {
  ProfilePanel,
  ProfileSkeletonBlock,
} from '@/components/profile/ProfileShell';

interface ProfileMemoriesCardProps {
  userId: string | undefined;
}

function MemoryTile({ memory }: { memory: MemoryWithRelations }) {
  const primaryMediaURL = getPrimaryMemoryMediaURL(memory);
  const tags = memory.tags?.slice(0, 3) ?? [];

  return (
    <article className="overflow-hidden border-2 border-border bg-background">
      <div className="flex items-center justify-between gap-3 border-b-2 border-border bg-[#fff4a8] px-4 py-2">
        <span className="truncate font-kalam text-lg font-bold text-foreground">
          {memory.title}
        </span>
        <span className="shrink-0 border-2 border-border bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground">
          {VISIBILITY_LABELS[memory.visibility]}
        </span>
      </div>

      {primaryMediaURL ? (
        <div className="relative h-44 w-full border-b-2 border-border bg-muted">
          <Image
            src={primaryMediaURL}
            alt={memory.title}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="flex h-44 items-center justify-center border-b-2 border-border bg-[#f2fbff]">
          <div className="border-2 border-border bg-card px-4 py-3 font-hand text-sm text-muted-foreground">
            No preview available
          </div>
        </div>
      )}

      <div className="space-y-4 p-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-foreground/70">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {memory.location?.buildingName ?? 'Location not set'}
            </span>
          </div>
          {memory.description ? (
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-foreground/80">
              {memory.description}
            </p>
          ) : (
            <p className="mt-3 text-sm italic text-muted-foreground">
              No caption yet.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {tags.length > 0 ? (
            tags.map((tag) => (
              <span
                key={tag.id}
                className="border-2 border-border bg-[#d6f5df] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground"
              >
                {tag.name}
              </span>
            ))
          ) : (
            <span className="border-2 border-dashed border-border px-2 py-1 text-[11px] italic text-muted-foreground">
              No tags
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
          <span className="inline-flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5" />
            {memory._count?.votes ?? 0} votes
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            {memory._count?.comments ?? 0} comments
          </span>
        </div>
      </div>
    </article>
  );
}

function MemoryTileSkeleton() {
  return (
    <div className="overflow-hidden border-2 border-border bg-background">
      <div className="flex items-center justify-between gap-3 border-b-2 border-border bg-[#fff4a8] px-4 py-2">
        <ProfileSkeletonBlock className="h-5 w-1/2 border-0 bg-[#f3dc70]" />
        <ProfileSkeletonBlock className="h-5 w-20 border-0 bg-white/80" />
      </div>
      <ProfileSkeletonBlock className="h-44 w-full border-0 border-b-2" />
      <div className="space-y-3 p-4">
        <ProfileSkeletonBlock className="h-4 w-2/3 border-0" />
        <ProfileSkeletonBlock className="h-4 w-full border-0" />
        <ProfileSkeletonBlock className="h-4 w-4/5 border-0" />
        <div className="flex gap-2">
          <ProfileSkeletonBlock className="h-7 w-16 border-0" />
          <ProfileSkeletonBlock className="h-7 w-20 border-0" />
        </div>
      </div>
    </div>
  );
}

export function ProfileMemoriesCard({ userId }: ProfileMemoriesCardProps) {
  const { data, isPending, isError, error } = useMemoriesByCreator(userId);

  const memories = data?.data ?? [];

  const errorMessage =
    isError && error instanceof Error
      ? error.message
      : isError
        ? 'Failed to load memories. Please try again.'
        : undefined;

  return (
    <ProfilePanel
      eyebrow=""
      title="My Memories"
      description="A flat, pinboard-like view of the stories you have already added."
      accentClassName="bg-[#ffe3b3]"
      headerContent={
        !isPending && !isError ? (
          <div className="border-2 border-border bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-foreground">
            {memories.length} total
          </div>
        ) : undefined
      }
      contentClassName="space-y-4"
    >
      {isPending && (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <MemoryTileSkeleton key={index} />
          ))}
        </div>
      )}

      {isError && (
        <div className="border-2 border-border bg-[#fff8fb] px-4 py-6">
          <p className="text-sm text-red-500">
            {errorMessage ?? 'Failed to load memories. Please try again.'}
          </p>
        </div>
      )}

      {!isPending && !isError && memories.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border bg-[#fffdf5] py-10 text-muted-foreground">
          <ImageOff className="h-10 w-10" />
          <p className="text-sm italic">
            You haven&apos;t uploaded any memories yet.
          </p>
        </div>
      )}

      {!isPending && !isError && memories.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {memories.map((memory) => (
            <MemoryTile key={memory.id} memory={memory} />
          ))}
        </div>
      )}
    </ProfilePanel>
  );
}
