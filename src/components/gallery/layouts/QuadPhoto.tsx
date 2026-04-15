'use client';

import { GalleryPolaroid } from '../GalleryPolaroid';

interface QuadPhotoProps {
  photos: { src: string; alt: string }[];
  onPhotoClick?: (index: number) => void;
}

export function QuadPhoto({ photos, onPhotoClick }: QuadPhotoProps) {
  if (photos.length !== 4) {
    console.warn('QuadPhoto expects exactly 4 photos');
    return null;
  }

  return (
    <div
      style={{
        ['--gallery-layout-scale' as string]:
          'min(var(--gallery-card-scale, 1), calc((100vw - 3rem) / 720))',
        width: 'calc(720px * var(--gallery-layout-scale))',
        height: 'calc(640px * var(--gallery-layout-scale))',
        maxWidth: '100%',
      }}
    >
      <div
        className="relative"
        style={{
          width: 720,
          height: 640,
          transform: 'scale(var(--gallery-layout-scale))',
          transformOrigin: 'left top',
        }}
      >
        <GalleryPolaroid
          src={photos[0].src}
          alt={photos[0].alt}
          width={340}
          height={500}
          rotation="-6deg"
          offsetX="0px"
          offsetY="30px"
          zIndex={1}
          onClick={() => onPhotoClick?.(0)}
        />
        <GalleryPolaroid
          src={photos[1].src}
          alt={photos[1].alt}
          width={340}
          height={500}
          rotation="4deg"
          offsetX="360px"
          offsetY="0px"
          zIndex={2}
          onClick={() => onPhotoClick?.(1)}
        />
        <GalleryPolaroid
          src={photos[2].src}
          alt={photos[2].alt}
          width={340}
          height={500}
          rotation="3deg"
          offsetX="20px"
          offsetY="140px"
          zIndex={3}
          onClick={() => onPhotoClick?.(2)}
        />
        <GalleryPolaroid
          src={photos[3].src}
          alt={photos[3].alt}
          width={340}
          height={500}
          rotation="-5deg"
          offsetX="380px"
          offsetY="110px"
          zIndex={4}
          onClick={() => onPhotoClick?.(3)}
        />
      </div>
    </div>
  );
}
