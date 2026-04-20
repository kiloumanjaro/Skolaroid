'use client';

import { PolaroidCluster } from './PolaroidCluster';
import type { MemoryWithCoordinates } from '@/lib/hooks/useAllMemoriesWithCoordinates';

function captionFontSize(text: string): string {
  if (text.length <= 10) return '1.55rem';
  if (text.length <= 40) return '1.3rem';
  return '1.1rem';
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface GalleryMemoryCardProps {
  memory: MemoryWithCoordinates;
  index?: number;
  onClick: () => void;
}

export function GalleryMemoryCard({
  memory,
  index = 0,
  onClick,
}: GalleryMemoryCardProps) {
  const photos = memory.mediaURL
    ? [{ src: memory.mediaURL, alt: memory.title }]
    : [];

  if (photos.length === 0) {
    return null;
  }

  const captionText = memory.description || memory.title;
  const uploaderName = memory.creator
    ? `${memory.creator.firstName} ${memory.creator.lastName}`.trim()
    : null;
  const initials = uploaderName
    ? uploaderName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';
  const dateUploaded = formatDate(memory.createdAt);

  return (
    <div className="flex shrink-0 flex-col items-center">
      <PolaroidCluster
        photos={photos}
        startIndex={index}
        onPhotoClick={onClick}
      />
      <div
        className="flex flex-col items-center text-center"
        style={{
          marginTop: 'var(--gallery-cluster-caption-gap)',
          gap: '0.4rem',
        }}
      >
        {/* Avatar + uploader name */}
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-border bg-secondary text-xs font-bold text-gray-600">
            {initials}
          </div>
          {uploaderName && (
            <span className="font-hand text-sm font-semibold text-gray-700">
              {uploaderName}
            </span>
          )}
        </div>
        {/* Caption */}
        <p
          className="hidden font-dancing italic leading-[1.15] text-gray-700"
          style={{ fontSize: captionFontSize(captionText), maxWidth: '14rem' }}
        >
          {captionText}
        </p>
        {/* Date */}
        {dateUploaded && (
          <span className="hidden font-hand text-xs text-gray-400">
            {dateUploaded}
          </span>
        )}
      </div>
    </div>
  );
}
