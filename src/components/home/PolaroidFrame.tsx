'use client';

import Image from 'next/image';

interface PolaroidFrameProps {
  imageUrl?: string;
  label?: string;
  color?: string;
}

export function PolaroidFrame({
  imageUrl,
  label = '',
  color = 'bg-secondary',
}: PolaroidFrameProps) {
  return (
    <div className="w-full border-2 border-border bg-card p-2 pb-12 [filter:drop-shadow(4px_4px_0px_#2d2d2d)] sm:w-80">
      <div className="relative aspect-[4/5] overflow-hidden bg-secondary sm:aspect-auto sm:h-[320px]">
        {imageUrl ? (
          <>
            <Image
              src={imageUrl}
              alt={`${label} era photo`}
              fill
              className="object-cover object-center transition-opacity duration-300 group-hover:opacity-40"
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
    </div>
  );
}
