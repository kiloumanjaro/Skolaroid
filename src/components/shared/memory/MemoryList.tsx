'use client';

// TODO: Integrate into map sidebar when landmark click handlers are implemented.

import { useMemoriesByLocation } from '@/lib/hooks/useMemoriesByLocation';
import { MemoryCard } from './MemoryCard';

interface MemoryListProps {
  locationId: string | null;
  locationName?: string;
}

export function MemoryList({ locationId, locationName }: MemoryListProps) {
  const { data, isPending, isError } = useMemoriesByLocation(locationId);

  if (!locationId) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        Select a landmark to view memories
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        Loading memories...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center text-sm text-red-500">
        Failed to load memories. Please try again.
      </div>
    );
  }

  const memories = data?.data ?? [];

  if (memories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-8 text-muted-foreground">
        <p>No memories yet{locationName ? ` for ${locationName}` : ''}</p>
        <p className="text-xs">Be the first to add one!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
      {memories.map((memory) => (
        <MemoryCard key={memory.id} memory={memory} />
      ))}
    </div>
  );
}
