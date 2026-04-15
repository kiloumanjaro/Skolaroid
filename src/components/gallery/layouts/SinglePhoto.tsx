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
        ['--gallery-layout-scale' as string]:
          'min(var(--gallery-card-scale, 1), calc((100vw - 3rem) / 380))',
        width: 'calc(380px * var(--gallery-layout-scale))',
        height: 'calc(560px * var(--gallery-layout-scale))',
        maxWidth: '100%',
      }}
    >
      <div
        className="relative"
        style={{
          width: 380,
          height: 560,
          transform: 'scale(var(--gallery-layout-scale))',
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
