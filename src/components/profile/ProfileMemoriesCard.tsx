'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useMemoriesByCreator } from '@/lib/hooks/useMemoriesByCreator';
import { MemoryCard } from '@/components/memory-card';
import { ImageOff } from 'lucide-react';

interface ProfileMemoriesCardProps {
  userId: string | undefined;
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
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">
          My Memories
          {!isPending && !isError && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({memories.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isPending && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        )}

        {isError && (
          <p className="text-sm text-red-500">
            {errorMessage ?? 'Failed to load memories. Please try again.'}
          </p>
        )}

        {!isPending && !isError && memories.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
            <ImageOff className="h-10 w-10" />
            <p className="text-sm">
              You haven&apos;t uploaded any memories yet.
            </p>
          </div>
        )}

        {!isPending && !isError && memories.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {memories.map((memory) => (
              <MemoryCard key={memory.id} memory={memory} isOwner />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
