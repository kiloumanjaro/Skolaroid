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

  return (
    <div className="flex shrink-0 items-center gap-8">
      {/* Photo cluster (left side) */}
      {photos.length > 0 ? (
        <PolaroidCluster photos={photos} onPhotoClick={onClick} />
      ) : (
        <button
          type="button"
          onClick={onClick}
          className="border-2 border-border bg-card p-2 pb-12 shadow-[4px_4px_0px_0px_#2d2d2d] transition-transform hover:scale-[1.02]"
          aria-label={`Open notebook for ${memory.title}`}
        >
          <div className="flex h-[324px] w-[290px] items-center justify-center bg-secondary">
            <span className="font-dancing text-3xl italic text-muted-foreground">
              No Photo Yet
            </span>
          </div>
        </button>
      )}

      {/* Caption (right side) */}
      <div className="w-72 shrink-0">
        <p className="font-dancing text-4xl italic leading-relaxed text-gray-700">
          {memory.description || memory.title}
        </p>
      </div>
    </div>
  );
}
