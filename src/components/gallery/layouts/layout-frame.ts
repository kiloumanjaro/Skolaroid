import type { CSSProperties } from 'react';

export const GALLERY_STACK_FRAME_HEIGHT = 520;

const BASE_POLAROID_WIDTH = 280;

export const SINGLE_STACK_FRAME_HEIGHT = `calc(var(--polaroid-base) * ${GALLERY_STACK_FRAME_HEIGHT} / ${BASE_POLAROID_WIDTH})`;
export const SINGLE_STACK_FRAME_OFFSET_Y = `calc(var(--polaroid-base) * 28 / ${BASE_POLAROID_WIDTH})`;

export function getGalleryLayoutFrameStyle(layoutWidth: number): CSSProperties {
  return {
    ['--gallery-layout-scale' as string]: `min(var(--gallery-card-scale, 1), calc((100vw - 3rem) / ${layoutWidth}))`,
    width: `calc(${layoutWidth}px * var(--gallery-layout-scale))`,
    height: `calc(${GALLERY_STACK_FRAME_HEIGHT}px * var(--gallery-layout-scale))`,
    maxWidth: '100%',
  };
}

export function getGalleryLayoutInnerStyle(layoutWidth: number): CSSProperties {
  return {
    width: layoutWidth,
    height: GALLERY_STACK_FRAME_HEIGHT,
    transform: 'scale(var(--gallery-layout-scale))',
    transformOrigin: 'left top',
  };
}
