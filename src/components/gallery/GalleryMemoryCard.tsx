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
    <div className="flex shrink-0 flex-row items-center gap-6 md:gap-8">
      {/* Photo cluster (left side) */}
      <PolaroidCluster photos={photos} onPhotoClick={onClick} />

      {/* Caption (right side) */}
      <div className="w-[clamp(8rem,12vw,12rem)] shrink-0">
        <p className="font-dancing text-[clamp(1.1rem,1.8vw,1.6rem)] italic leading-[1.15] text-gray-700">
          {memory.description || memory.title}
        </p>
      </div>
    </div>
  );
}
