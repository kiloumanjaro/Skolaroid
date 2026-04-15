'use client';

import { PolaroidCluster } from './PolaroidCluster';
import type { MemoryWithCoordinates } from '@/lib/hooks/useAllMemoriesWithCoordinates';

interface GalleryMemoryCardProps {
  memory: MemoryWithCoordinates;
  onClick: () => void;
}

export function GalleryMemoryCard({ memory, onClick }: GalleryMemoryCardProps) {
  // For now, single photo per memory (Memory.mediaURL is a single string)
  const photos = memory.mediaURL
    ? [{ src: memory.mediaURL, alt: memory.title }]
    : [];

  if (photos.length === 0) {
    return null;
  }

  return (
    <div className="flex w-[calc(100vw-3rem)] max-w-[40rem] shrink-0 flex-col items-center gap-4 sm:w-auto sm:max-w-none sm:flex-row sm:items-center md:gap-5">
      {/* Photo cluster (left side) */}
      <PolaroidCluster photos={photos} onPhotoClick={onClick} />

      {/* Caption (right side) */}
      <div className="w-full sm:w-[clamp(9rem,16vw,13rem)] sm:shrink-0">
        <p className="text-center font-dancing text-[clamp(1.35rem,2.1vw,1.9rem)] italic leading-[1.15] text-gray-700 sm:text-left">
          {memory.description || memory.title}
        </p>
      </div>
    </div>
  );
}
