'use client';

import { GalleryPolaroid } from '../GalleryPolaroid';

interface DualPhotoProps {
  photos: { src: string; alt: string }[];
  startIndex?: number;
  interactive?: boolean;
  onPhotoClick?: (index: number) => void;
}

export function DualPhoto({
  photos,
  startIndex = 0,
  interactive = true,
  onPhotoClick,
}: DualPhotoProps) {
  if (photos.length !== 2) {
    console.warn('DualPhoto expects exactly 2 photos');
    return null;
  }

  return (
    <div
      style={{
        ['--gallery-layout-scale' as string]:
          'min(var(--gallery-card-scale, 1), calc((100vw - 3rem) / 620))',
        width: 'calc(620px * var(--gallery-layout-scale))',
        height: 'calc(580px * var(--gallery-layout-scale))',
        maxWidth: '100%',
      }}
    >
      <div
        className="relative"
        style={{
          width: 620,
          height: 580,
          transform: 'scale(var(--gallery-layout-scale))',
          transformOrigin: 'left top',
        }}
      >
        <GalleryPolaroid
          src={photos[0].src}
          alt={photos[0].alt}
          index={startIndex}
          offsetX="-20px"
          offsetY="20px"
          zIndex={1}
          interactive={interactive}
          onClick={() => onPhotoClick?.(0)}
        />
        <GalleryPolaroid
          src={photos[1].src}
          alt={photos[1].alt}
          index={startIndex + 1}
          offsetX="310px"
          offsetY="0px"
          zIndex={2}
          interactive={interactive}
          onClick={() => onPhotoClick?.(1)}
        />
      </div>
    </div>
  );
}
