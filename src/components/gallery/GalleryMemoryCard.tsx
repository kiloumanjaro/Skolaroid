'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';
import { PolaroidCluster } from './PolaroidCluster';
import { SpeechBubble } from '@/components/speech-bubble';
import type { MemoryWithCoordinates } from '@/lib/hooks/useAllMemoriesWithCoordinates';
import { getMemoryMediaURLs } from '@/lib/memory-media';

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
  onProfileClick?: () => void;
}

export function GalleryMemoryCard({
  memory,
  index = 0,
  interactive = true,
  onClick,
  onProfileClick,
}: GalleryMemoryCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isInIndicatorZone, setIsInIndicatorZone] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);

  const uploaderName = memory.creator
    ? `${memory.creator.firstName} ${memory.creator.lastName}`.trim()
    : null;

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
      const distanceFromCenter = Math.abs(cardCenter - parentCenter);
      const indicatorThreshold = Math.max(parentRect.width * 0.32, 120);
      const nextIsInIndicatorZone = distanceFromCenter <= indicatorThreshold;

      setIsInIndicatorZone(nextIsInIndicatorZone);
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
  const showBubbleAnchor = isInIndicatorZone || isHovered;
  const isCaptionRevealed = isHovered;
  const handleProfileActivate = () => {
    setIsHovered(true);
    onProfileClick?.();
  };

  // Calculate where the tail of the bubble should mathematically point:
  // The bottom avatar/name container uses gap-2 (8px). Avatar is 36px wide.
  // The entire row width is: 36 (avatar) + 8 (gap) + nameWidth.
  // Since the flex row is centered, the left edge of the row is at (-TotalWidth / 2) relative to the flex center.
  // The avatar is at the left edge. Its center is at (-TotalWidth / 2) + 18.
  const revealedBubbleWidth = 332;

  return (
    <div ref={cardRef} className="flex shrink-0 flex-col items-center">
      <div className="relative isolate">
        <div className="relative z-0">
          <PolaroidCluster
            photos={photos}
            startIndex={index}
            interactive={interactive}
            onPhotoClick={(photoIndex) => onClick?.(photoIndex)}
          />
        </div>
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
          className="flex cursor-pointer items-center gap-2"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onFocus={() => setIsHovered(true)}
          onBlur={() => setIsHovered(false)}
          onClick={handleProfileActivate}
        >
          <div className="relative flex items-center">
            <div
              data-gallery-avatar
              className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary"
            >
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
            {showBubbleAnchor && (
              <>
                <div
                  className={`pointer-events-none absolute bottom-full left-1/2 z-[210] mb-2 -translate-x-1/2 transition-all duration-200 ${
                    isCaptionRevealed
                      ? 'translate-y-3 opacity-0'
                      : 'translate-y-0 opacity-100'
                  }`}
                >
                  <div className="relative">
                    <SpeechBubble
                      width={60}
                      message=" "
                      visible
                      tailPosition="center"
                      className="drop-shadow-sm [&>div]:px-2 [&>div]:py-4 [&_p]:text-xs [&_p]:leading-none [&_svg]:h-3"
                    />
                    {!isCaptionRevealed && (
                      <div className="absolute inset-x-0 top-[calc(50%-5px)] flex items-center justify-center gap-1">
                        <span className="typing-dot typing-dot-1" />
                        <span className="typing-dot typing-dot-2" />
                        <span className="typing-dot typing-dot-3" />
                      </div>
                    )}
                  </div>
                </div>
                <div
                  className={`duration-250 pointer-events-none absolute bottom-full left-1/2 z-[211] mb-2 -translate-x-1/2 transition-all ${
                    isCaptionRevealed
                      ? 'translate-y-0 opacity-100 delay-150'
                      : 'translate-y-4 opacity-0'
                  }`}
                >
                  <SpeechBubble
                    width={revealedBubbleWidth}
                    message={captionText}
                    visible
                    tailPosition="center"
                    className="drop-shadow-sm [&>div]:px-4 [&>div]:py-3 [&_p]:text-sm [&_p]:leading-snug [&_svg]:h-3"
                  />
                </div>
              </>
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
      <style jsx>{`
        .typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background: rgb(156 163 175);
          animation: gallery-bounce-dot 0.9s ease-in-out infinite;
        }

        .typing-dot-2 {
          animation-delay: 0.15s;
        }

        .typing-dot-3 {
          animation-delay: 0.3s;
        }

        @keyframes gallery-bounce-dot {
          0% {
            transform: translateY(0);
          }

          30% {
            transform: translateY(-5px);
          }

          60% {
            transform: translateY(0);
          }

          100% {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
