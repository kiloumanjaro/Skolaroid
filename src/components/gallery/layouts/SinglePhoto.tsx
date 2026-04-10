'use client';

import { GalleryPolaroid } from '../GalleryPolaroid';

interface SinglePhotoProps {
  photo: { src: string; alt: string };
  onPhotoClick?: () => void;
}

export function SinglePhoto({ photo, onPhotoClick }: SinglePhotoProps) {
  return (
    <div
      style={{
        width: 'calc(380px * var(--gallery-card-scale, 1))',
        height: 'calc(560px * var(--gallery-card-scale, 1))',
      }}
    >
      <div
        className="relative"
        style={{
          width: 380,
          height: 560,
          transform: 'scale(var(--gallery-card-scale, 1))',
          transformOrigin: 'left top',
        }}
      >
        <GalleryPolaroid
          src={photo.src}
          alt={photo.alt}
          width={380}
          height={560}
          rotation="2deg"
          zIndex={1}
          onClick={onPhotoClick}
        />
      </div>
    </div>
  );
}
