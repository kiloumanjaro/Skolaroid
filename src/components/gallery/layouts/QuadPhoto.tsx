'use client';

import { GalleryPolaroid } from '../GalleryPolaroid';
import {
  getGalleryLayoutFrameStyle,
  getGalleryLayoutInnerStyle,
} from './layout-frame';

interface QuadPhotoProps {
  photos: { src: string; alt: string }[];
  startIndex?: number;
  interactive?: boolean;
  onPhotoClick?: (index: number) => void;
}

export function QuadPhoto({
  photos,
  startIndex = 0,
  interactive = true,
  onPhotoClick,
}: QuadPhotoProps) {
  if (photos.length !== 4) {
    console.warn('QuadPhoto expects exactly 4 photos');
    return null;
  }

  return (
    <div style={getGalleryLayoutFrameStyle(820)}>
      <div className="relative" style={getGalleryLayoutInnerStyle(820)}>
        <GalleryPolaroid
          src={photos[0].src}
          alt={photos[0].alt}
          index={startIndex}
          offsetX="20px"
          offsetY="8px"
          hoverDelay={0.16}
          zIndex={1}
          interactive={interactive}
          onClick={() => onPhotoClick?.(0)}
        />
        <GalleryPolaroid
          src={photos[1].src}
          alt={photos[1].alt}
          index={startIndex + 1}
          offsetX="284px"
          offsetY="0px"
          hoverDelay={0.16}
          zIndex={2}
          interactive={interactive}
          onClick={() => onPhotoClick?.(1)}
        />
        <GalleryPolaroid
          src={photos[2].src}
          alt={photos[2].alt}
          index={startIndex + 2}
          offsetX="116px"
          offsetY="56px"
          hoverDelay={0.16}
          zIndex={3}
          interactive={interactive}
          onClick={() => onPhotoClick?.(2)}
        />
        <GalleryPolaroid
          src={photos[3].src}
          alt={photos[3].alt}
          index={startIndex + 3}
          offsetX="372px"
          offsetY="48px"
          hoverDelay={0.16}
          zIndex={4}
          interactive={interactive}
          onClick={() => onPhotoClick?.(3)}
        />
      </div>
    </div>
  );
}
