'use client';

import { GalleryPolaroid } from '../GalleryPolaroid';
import {
  getGalleryLayoutFrameStyle,
  getGalleryLayoutInnerStyle,
  SINGLE_STACK_FRAME_OFFSET_Y,
} from './layout-frame';

interface SinglePhotoProps {
  photo: { src: string; alt: string };
  startIndex?: number;
  interactive?: boolean;
  onPhotoClick?: () => void;
}

export function SinglePhoto({
  photo,
  startIndex = 0,
  interactive = true,
  onPhotoClick,
}: SinglePhotoProps) {
  return (
    <div style={getGalleryLayoutFrameStyle(280)}>
      <div className="relative" style={getGalleryLayoutInnerStyle(280)}>
        <GalleryPolaroid
          src={photo.src}
          alt={photo.alt}
          index={startIndex}
          offsetY={SINGLE_STACK_FRAME_OFFSET_Y}
          hoverDelay={0.08}
          zIndex={1}
          interactive={interactive}
          onClick={onPhotoClick}
        />
      </div>
    </div>
  );
}
