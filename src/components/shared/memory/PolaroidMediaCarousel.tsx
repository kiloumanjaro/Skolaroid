'use client';

import { useCallback, useRef, type TouchEvent } from 'react';
import Image from 'next/image';
import type { MemoryWithCoordinates } from '@/lib/hooks/useAllMemoriesWithCoordinates';
import { getMemoryMediaURLs } from '@/lib/memory-media';

type MemoryMediaShape = Pick<
  MemoryWithCoordinates,
  'id' | 'title' | 'mediaURLs'
>;

interface PolaroidMediaCarouselProps {
  memory: MemoryMediaShape;
  activeIndex: number;
  onIndexChange?: (nextIndex: number) => void;
  showControls?: boolean;
}

const SWIPE_THRESHOLD_PX = 48;

export function PolaroidMediaCarousel({
  memory,
  activeIndex,
  onIndexChange,
  showControls = true,
}: PolaroidMediaCarouselProps) {
  const mediaURLs = getMemoryMediaURLs(memory);
  const hasMedia = mediaURLs.length > 0;
  const canNavigate = showControls && mediaURLs.length > 1 && !!onIndexChange;

  const safeIndex =
    mediaURLs.length > 0
      ? ((activeIndex % mediaURLs.length) + mediaURLs.length) % mediaURLs.length
      : 0;

  const touchStartXRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef(0);

  const goToIndex = useCallback(
    (nextIndex: number) => {
      if (!onIndexChange || mediaURLs.length === 0) return;

      const wrappedIndex =
        ((nextIndex % mediaURLs.length) + mediaURLs.length) % mediaURLs.length;
      onIndexChange(wrappedIndex);
    },
    [onIndexChange, mediaURLs.length]
  );

  const handleTouchStart = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (!canNavigate) return;

      touchStartXRef.current = event.touches[0]?.clientX ?? null;
      touchDeltaXRef.current = 0;
    },
    [canNavigate]
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (!canNavigate || touchStartXRef.current === null) return;

      const currentX = event.touches[0]?.clientX ?? touchStartXRef.current;
      touchDeltaXRef.current = currentX - touchStartXRef.current;
    },
    [canNavigate]
  );

  const handleTouchEnd = useCallback(() => {
    if (!canNavigate) return;

    if (Math.abs(touchDeltaXRef.current) >= SWIPE_THRESHOLD_PX) {
      if (touchDeltaXRef.current < 0) {
        goToIndex(safeIndex + 1);
      } else {
        goToIndex(safeIndex - 1);
      }
    }

    touchStartXRef.current = null;
    touchDeltaXRef.current = 0;
  }, [canNavigate, goToIndex, safeIndex]);

  return (
    <div className="flex h-full w-full max-w-sm flex-col">
      <div className="flex h-full flex-col border-2 border-black bg-white px-[10px] pb-[60px] pt-[10px]">
        {hasMedia ? (
          <div
            className="relative flex-1 overflow-hidden border border-black bg-neutral-100"
            style={{ aspectRatio: '1/1' }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Image
              src={mediaURLs[safeIndex]}
              alt={`${memory.title} image ${safeIndex + 1}`}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div
            className="flex flex-1 items-center justify-center border border-black bg-neutral-100"
            style={{ aspectRatio: '1/1' }}
          >
            <span className="text-xl text-muted-foreground">No image</span>
          </div>
        )}
      </div>
    </div>
  );
}
