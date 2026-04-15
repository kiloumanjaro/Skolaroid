'use client';

import { GalleryPolaroid } from '../GalleryPolaroid';

interface DualPhotoProps {
  photos: { src: string; alt: string }[];
  onPhotoClick?: (index: number) => void;
}

export function DualPhoto({ photos, onPhotoClick }: DualPhotoProps) {
  if (photos.length !== 2) {
    console.warn('DualPhoto expects exactly 2 photos');
    return null;
  }

  return (
    <div
      style={{
        ['--gallery-layout-scale' as string]:
          'min(var(--gallery-card-scale, 1), calc((100vw - 3rem) / 480))',
        width: 'calc(480px * var(--gallery-layout-scale))',
        height: 'calc(580px * var(--gallery-layout-scale))',
        maxWidth: '100%',
      }}
    >
      <div
        className="relative"
        style={{
          width: 480,
          height: 580,
          transform: 'scale(var(--gallery-layout-scale))',
          transformOrigin: 'left top',
        }}
      >
        <GalleryPolaroid
          src={photos[0].src}
          alt={photos[0].alt}
          width={360}
          height={540}
          rotation="-6deg"
          offsetX="-20px"
          offsetY="20px"
          zIndex={1}
          onClick={() => onPhotoClick?.(0)}
        />
        <GalleryPolaroid
          src={photos[1].src}
          alt={photos[1].alt}
          width={360}
          height={540}
          rotation="5deg"
          offsetX="140px"
          offsetY="0px"
          zIndex={2}
          onClick={() => onPhotoClick?.(1)}
        />
      </div>
    </div>
  );
}
