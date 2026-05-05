'use client';

import { GalleryPolaroid } from '../GalleryPolaroid';

interface SinglePhotoProps {
  photo: { src: string; alt: string };
  startIndex?: number;
  interactive?: boolean;
  onPhotoClick?: () => void;
}

export function SinglePhoto({
  photo,
  startIndex = 0,
  interactive = true,
  onPhotoClick,
}: SinglePhotoProps) {
  return (
    <div
      style={{
        position: 'relative',
        width: 'var(--polaroid-base)',
        height: 'calc(var(--polaroid-base) * 1.6)',
      }}
    >
      <GalleryPolaroid
        src={photo.src}
        alt={photo.alt}
        index={startIndex}
        zIndex={1}
        interactive={interactive}
        onClick={onPhotoClick}
      />
    </div>
  );
}
