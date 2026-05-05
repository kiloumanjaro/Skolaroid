'use client';

import { GalleryPolaroid } from '../GalleryPolaroid';

interface TriplePhotoProps {
  photos: { src: string; alt: string }[];
  startIndex?: number;
  interactive?: boolean;
  onPhotoClick?: (index: number) => void;
}

export function TriplePhoto({
  photos,
  startIndex = 0,
  interactive = true,
  onPhotoClick,
}: TriplePhotoProps) {
  if (photos.length !== 3) {
    console.warn('TriplePhoto expects exactly 3 photos');
    return null;
  }

  return (
    <div
      style={{
        ['--gallery-layout-scale' as string]:
          'min(var(--gallery-card-scale, 1), calc((100vw - 3rem) / 680))',
        width: 'calc(680px * var(--gallery-layout-scale))',
        height: 'calc(600px * var(--gallery-layout-scale))',
        maxWidth: '100%',
      }}
    >
      <div
        className="relative"
        style={{
          width: 680,
          height: 600,
          transform: 'scale(var(--gallery-layout-scale))',
          transformOrigin: 'left top',
        }}
      >
        <GalleryPolaroid
          src={photos[0].src}
          alt={photos[0].alt}
          index={startIndex}
          offsetX="0px"
          offsetY="40px"
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
        <GalleryPolaroid
          src={photos[2].src}
          alt={photos[2].alt}
          index={startIndex + 2}
          offsetX="345px"
          offsetY="30px"
          zIndex={3}
          interactive={interactive}
          onClick={() => onPhotoClick?.(2)}
        />
      </div>
    </div>
  );
}
