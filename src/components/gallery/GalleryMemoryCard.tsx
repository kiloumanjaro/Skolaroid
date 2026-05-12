'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';
import { PolaroidCluster } from './PolaroidCluster';
import { SpeechBubble } from '@/components/speech-bubble';
import type { MemoryWithCoordinates } from '@/lib/hooks/useAllMemoriesWithCoordinates';
import { getMemoryMediaURLs } from '@/lib/memory-media';

// DEV TOGGLE: Set to true to use the speech bubble overlay instead of the cinematic vignette
const USE_SPEECH_BUBBLE = true;

function captionFontSize(text: string): string {
  if (text.length <= 10) return '1.55rem';
  if (text.length <= 40) return '1.3rem';
  return '1.1rem';
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface GalleryMemoryCardProps {
  memory: MemoryWithCoordinates;
  index?: number;
  interactive?: boolean;
  onClick?: (photoIndex?: number) => void;
}

export function GalleryMemoryCard({
  memory,
  index = 0,
  interactive = true,
  onClick,
}: GalleryMemoryCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isCentered, setIsCentered] = useState(false);
  const [isCaptionRevealed, setIsCaptionRevealed] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);
  const [nameWidth, setNameWidth] = useState(0);

  const uploaderName = memory.creator
    ? `${memory.creator.firstName} ${memory.creator.lastName}`.trim()
    : null;

  // Measure the width of the uploaderName text robustly
  useEffect(() => {
    if (!nameRef.current) return;

    // Initial measurement
    setNameWidth(nameRef.current.getBoundingClientRect().width);

    // Watch for font loading or layout shifts
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setNameWidth(entry.contentRect.width);
      }
    });

    observer.observe(nameRef.current);
    return () => observer.disconnect();
  }, [uploaderName]);

  useEffect(() => {
    const card = cardRef.current;
    if (!card || typeof window === 'undefined') return;

    const getScrollParent = (node: HTMLElement): HTMLElement | null => {
      let current = node.parentElement;
      while (current) {
        const styles = window.getComputedStyle(current);
        if (
          styles.overflowX === 'auto' ||
          styles.overflowX === 'scroll' ||
          styles.overflowX === 'overlay'
        ) {
          return current;
        }
        current = current.parentElement;
      }
      return null;
    };

    const scrollParent = getScrollParent(card);
    if (!scrollParent) return;

    const updateCenteredState = () => {
      const cardRect = card.getBoundingClientRect();
      const parentRect = scrollParent.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const parentCenter = parentRect.left + parentRect.width / 2;
      const nextIsCentered = Math.abs(cardCenter - parentCenter) <= 12;

      setIsCentered(nextIsCentered);
      if (!nextIsCentered) {
        setIsCaptionRevealed(false);
      }
    };

    updateCenteredState();
    scrollParent.addEventListener('scroll', updateCenteredState, {
      passive: true,
    });
    window.addEventListener('resize', updateCenteredState);

    return () => {
      scrollParent.removeEventListener('scroll', updateCenteredState);
      window.removeEventListener('resize', updateCenteredState);
    };
  }, []);

  const photos = getMemoryMediaURLs(memory).map((src) => ({
    src,
    alt: memory.title,
  }));

  if (photos.length === 0) {
    return null;
  }

  const captionText = memory.description || memory.title;
  const uploaderPhoto = memory.creator?.avatarUrl ?? null;
  const dateUploaded = formatDate(memory.createdAt);
  const bubbleText = isCaptionRevealed ? captionText : '...';

  const handleProfileTap = () => {
    setIsHovered(true);
    if (isCentered) {
      setIsCaptionRevealed(true);
    }
  };

  // Calculate where the tail of the bubble should mathematically point:
  // The bottom avatar/name container uses gap-2 (8px). Avatar is 36px wide.
  // The entire row width is: 36 (avatar) + 8 (gap) + nameWidth.
  // Since the flex row is centered, the left edge of the row is at (-TotalWidth / 2) relative to the flex center.
  // The avatar is at the left edge. Its center is at (-TotalWidth / 2) + 18.
  const totalRowWidth = 36 + (uploaderName ? 8 + nameWidth : 0);
  const avatarCenterOffset = -(totalRowWidth / 2) + 18;

  return (
    <div ref={cardRef} className="flex shrink-0 flex-col items-center">
      <div className="relative">
        <PolaroidCluster
          photos={photos}
          startIndex={index}
          interactive={interactive}
          onPhotoClick={(photoIndex) => onClick?.(photoIndex)}
        />

        {/* Bubble Caption Overlay (Hover) -- Now bound to polaroid center, but tail dynamically points to avatar */}
        {USE_SPEECH_BUBBLE && (
          <SpeechBubble
            width={280}
            height={110}
            message={captionText}
            visible={isHovered}
            tailPosition={avatarCenterOffset}
            className="pointer-events-none absolute bottom-[-2rem] left-1/2 z-[100] -translate-x-1/2"
          />
        )}

        {/* Cinematic Caption Overlay (Hover) */}
        {!USE_SPEECH_BUBBLE && (
          <div
            className={`pointer-events-none absolute inset-[-10rem] z-10 flex items-center justify-center p-8 transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              /* Smooth exponential decay fade out to infinity */
              background:
                'radial-gradient(ellipse 40% 50% at center, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.5) 25%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.08) 75%, transparent 100%)',
            }}
          >
            <p
              className="text-center font-dancing italic leading-[1.15] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
              style={{
                fontSize: captionFontSize(captionText),
                maxWidth: '30rem',
              }}
            >
              {captionText}
            </p>
          </div>
        )}
      </div>
      <div
        className="flex flex-col items-center text-center"
        style={{
          marginTop: '1.5rem',
          gap: '0.3rem',
        }}
      >
        {/* Avatar + uploader name */}
        <div
          className="flex cursor-pointer items-center gap-2 transition-opacity hover:opacity-80"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onFocus={() => setIsHovered(true)}
          onBlur={() => setIsHovered(false)}
          onClick={handleProfileTap}
        >
          <div className="relative flex items-center">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary">
              {uploaderPhoto ? (
                <Image
                  src={uploaderPhoto}
                  alt={uploaderName ?? 'User avatar'}
                  width={36}
                  height={36}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-4 w-4 text-gray-500" />
              )}
            </div>
            {isCentered && (
              <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2">
                <SpeechBubble
                  width={isCaptionRevealed ? 220 : 72}
                  message={bubbleText}
                  visible
                  tailPosition="center"
                  className="drop-shadow-sm [&>div]:p-2 [&_p]:text-xs [&_p]:leading-none [&_svg]:h-3"
                />
              </div>
            )}
          </div>
          {uploaderName && (
            <span
              ref={nameRef}
              className="font-hand text-sm font-semibold text-gray-700"
            >
              {uploaderName}
            </span>
          )}
        </div>
        {/* Date */}
        {dateUploaded && (
          <span className="hidden font-hand text-xs text-gray-400">
            {dateUploaded}
          </span>
        )}
      </div>
    </div>
  );
}
