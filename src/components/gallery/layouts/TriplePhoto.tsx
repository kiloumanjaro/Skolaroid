'use client';

import { GalleryPolaroid } from '../GalleryPolaroid';

interface TriplePhotoProps {
  photos: { src: string; alt: string }[];
  onPhotoClick?: (index: number) => void;
}

export function TriplePhoto({ photos, onPhotoClick }: TriplePhotoProps) {
  if (photos.length !== 3) {
    console.warn('TriplePhoto expects exactly 3 photos');
    return null;
  }

  return (
    <div
      style={{
        width: 'calc(560px * var(--gallery-card-scale, 1))',
        height: 'calc(600px * var(--gallery-card-scale, 1))',
      }}
    >
      <div
        className="relative"
        style={{
          width: 560,
          height: 600,
          transform: 'scale(var(--gallery-card-scale, 1))',
          transformOrigin: 'left top',
        }}
      >
        <GalleryPolaroid
          src={photos[0].src}
          alt={photos[0].alt}
          width={340}
          height={500}
          rotation="-8deg"
          offsetX="0px"
          offsetY="40px"
          zIndex={1}
          onClick={() => onPhotoClick?.(0)}
        />
        <GalleryPolaroid
          src={photos[1].src}
          alt={photos[1].alt}
          width={340}
          height={500}
          rotation="1deg"
          offsetX="200px"
          offsetY="0px"
          zIndex={2}
          onClick={() => onPhotoClick?.(1)}
        />
        <GalleryPolaroid
          src={photos[2].src}
          alt={photos[2].alt}
          width={340}
          height={500}
          rotation="7deg"
          offsetX="220px"
          offsetY="30px"
          zIndex={3}
          onClick={() => onPhotoClick?.(2)}
        />
      </div>
    </div>
  );
}
