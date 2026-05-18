'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { SpeechBubble } from '@/components/shared/display/SpeechBubble';

interface AboutPolaroidProps {
  children?: React.ReactNode;
  imageUrl?: string;
  label?: string;
  color?: string;
  rotation?: string;
  imagePosition?: string;
  imageScale?: number;
}

export function AboutPolaroid({
  children,
  imageUrl,
  label = '',
  color = 'bg-secondary',
  rotation = '',
  imagePosition = 'object-center',
  imageScale = 1,
}: AboutPolaroidProps) {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const captionText = 'from Upiana Collection, University Archives, UP Diliman';

  return (
    <div
      ref={cardRef}
      className={`relative w-full cursor-pointer border-2 border-border bg-card p-2 pb-8 shadow-[4px_4px_0px_0px_#2d2d2d] transition-transform duration-300 ease-out hover:rotate-0 ${rotation}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setIsHovered(!isHovered)}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
        {children ? (
          children
        ) : imageUrl ? (
          <>
            <Image
              src={imageUrl}
              alt={`${label} era photo`}
              fill
              className={`object-cover ${imagePosition} transition-opacity duration-300 group-hover:opacity-40`}
              style={{ transform: `scale(${imageScale})` }}
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <span
                className="select-none text-6xl font-black"
                style={{
                  color: '#1a1a1a',
                  filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.5))',
                }}
              >
                {label}
              </span>
            </div>
          </>
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center ${color}`}
          >
            <span className="text-3xl font-semibold text-muted-foreground">
              {label}
            </span>
          </div>
        )}
      </div>
      {isHovered && (
        <div className="pointer-events-none absolute -top-24 left-1/2 z-50 -translate-x-1/2 transition-opacity duration-200">
          <SpeechBubble
            width={280}
            message={captionText}
            visible
            tailPosition="center"
            className="drop-shadow-sm [&>div]:px-4 [&>div]:py-3 [&_p]:text-sm [&_p]:leading-snug [&_svg]:h-3"
          />
        </div>
      )}
    </div>
  );
}
