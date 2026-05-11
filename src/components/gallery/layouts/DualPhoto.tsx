'use client';

import { GalleryPolaroid } from '../GalleryPolaroid';
import {
  getGalleryLayoutFrameStyle,
  getGalleryLayoutInnerStyle,
} from './layout-frame';

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
    <div style={getGalleryLayoutFrameStyle(620)}>
      <div className="relative" style={getGalleryLayoutInnerStyle(620)}>
        <GalleryPolaroid
          src={photos[0].src}
          alt={photos[0].alt}
          index={startIndex}
          offsetX="36px"
          offsetY="42px"
          hoverDelay={0.16}
          zIndex={1}
          interactive={interactive}
          onClick={() => onPhotoClick?.(0)}
        />
        <GalleryPolaroid
          src={photos[1].src}
          alt={photos[1].alt}
          index={startIndex + 1}
          offsetX="228px"
          offsetY="12px"
          hoverDelay={0.16}
          zIndex={2}
          interactive={interactive}
          onClick={() => onPhotoClick?.(1)}
        />
      </div>
    </div>
  );
}
