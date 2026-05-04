'use client';

import { useState } from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';
import { PolaroidCluster } from './PolaroidCluster';
import { SpeechBubble } from '@/components/speech-bubble';
import type { MemoryWithCoordinates } from '@/lib/hooks/useAllMemoriesWithCoordinates';

// DEV TOGGLE: Set to true to use the speech bubble overlay instead of the cinematic vignette
const USE_SPEECH_BUBBLE = false;

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
  onClick: () => void;
}

export function GalleryMemoryCard({
  memory,
  index = 0,
  onClick,
}: GalleryMemoryCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const photos = memory.mediaURL
    ? [{ src: memory.mediaURL, alt: memory.title }]
    : [];

  if (photos.length === 0) {
    return null;
  }

  const captionText = memory.description || memory.title;
  const uploaderName = memory.creator
    ? `${memory.creator.firstName} ${memory.creator.lastName}`.trim()
    : null;
  const uploaderPhoto = memory.creator?.avatarUrl ?? null;
  const dateUploaded = formatDate(memory.createdAt);

  return (
    <div className="flex shrink-0 flex-col items-center">
      <div className="relative">
        <PolaroidCluster
          photos={photos}
          startIndex={index}
          onPhotoClick={onClick}
        />

        {/* Caption Overlay */}
        {USE_SPEECH_BUBBLE ? (
          <SpeechBubble
            width={280}
            height={110}
            message={captionText}
            visible={isHovered}
            className="pointer-events-none absolute bottom-[-1rem] left-1/2 z-[100] -translate-x-[20%] translate-y-full"
          />
        ) : (
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
          marginTop: '3rem',
          gap: '0.4rem',
        }}
      >
        {/* Avatar + uploader name */}
        <div
          className="flex cursor-pointer items-center gap-2 transition-opacity hover:opacity-80"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onFocus={() => setIsHovered(true)}
          onBlur={() => setIsHovered(false)}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-secondary">
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
          {uploaderName && (
            <span className="font-hand text-sm font-semibold text-gray-700">
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
