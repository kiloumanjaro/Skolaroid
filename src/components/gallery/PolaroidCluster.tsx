'use client';

import { SinglePhoto } from './layouts/SinglePhoto';
import { DualPhoto } from './layouts/DualPhoto';
import { TriplePhoto } from './layouts/TriplePhoto';
import { QuadPhoto } from './layouts/QuadPhoto';

interface PolaroidClusterProps {
  photos: { src: string; alt: string }[];
  startIndex?: number;
  onPhotoClick?: (index: number) => void;
}

export function PolaroidCluster({
  photos,
  startIndex = 0,
  onPhotoClick,
}: PolaroidClusterProps) {
  if (photos.length === 0) {
    return null;
  }

  if (photos.length === 1) {
    return (
      <SinglePhoto
        photo={photos[0]}
        startIndex={startIndex}
        onPhotoClick={() => onPhotoClick?.(0)}
      />
    );
  }

  if (photos.length === 2) {
    return (
      <DualPhoto
        photos={photos}
        startIndex={startIndex}
        onPhotoClick={onPhotoClick}
      />
    );
  }

  if (photos.length === 3) {
    return (
      <TriplePhoto
        photos={photos}
        startIndex={startIndex}
        onPhotoClick={onPhotoClick}
      />
    );
  }

  return (
    <QuadPhoto
      photos={photos.slice(0, 4)}
      startIndex={startIndex}
      onPhotoClick={onPhotoClick}
    />
  );
}
