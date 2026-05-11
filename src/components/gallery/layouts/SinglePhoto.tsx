'use client';

import { GalleryPolaroid } from '../GalleryPolaroid';
import {
  SINGLE_STACK_FRAME_HEIGHT,
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
    <div
      style={{
        position: 'relative',
        width: 'var(--polaroid-base)',
        height: SINGLE_STACK_FRAME_HEIGHT,
      }}
    >
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
  );
}
