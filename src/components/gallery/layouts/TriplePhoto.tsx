'use client';

import { GalleryPolaroid } from '../GalleryPolaroid';
import {
  getGalleryLayoutFrameStyle,
  getGalleryLayoutInnerStyle,
} from './layout-frame';

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
    <div style={getGalleryLayoutFrameStyle(680)}>
      <div className="relative" style={getGalleryLayoutInnerStyle(680)}>
        <GalleryPolaroid
          src={photos[0].src}
          alt={photos[0].alt}
          index={startIndex}
          offsetX="24px"
          offsetY="48px"
          hoverDelay={0.16}
          zIndex={1}
          interactive={interactive}
          onClick={() => onPhotoClick?.(0)}
        />
        <GalleryPolaroid
          src={photos[1].src}
          alt={photos[1].alt}
          index={startIndex + 1}
          offsetX="188px"
          offsetY="4px"
          hoverDelay={0.16}
          zIndex={2}
          interactive={interactive}
          onClick={() => onPhotoClick?.(1)}
        />
        <GalleryPolaroid
          src={photos[2].src}
          alt={photos[2].alt}
          index={startIndex + 2}
          offsetX="328px"
          offsetY="34px"
          hoverDelay={0.16}
          zIndex={3}
          interactive={interactive}
          onClick={() => onPhotoClick?.(2)}
        />
      </div>
    </div>
  );
}
