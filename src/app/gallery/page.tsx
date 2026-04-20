'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import type { MemoryWithCoordinates } from '@/lib/hooks/useAllMemoriesWithCoordinates';
import { GalleryMemoryCard } from '@/components/gallery/GalleryMemoryCard';
import { useAllMemoriesWithCoordinates } from '@/lib/hooks/useAllMemoriesWithCoordinates';
import { getEraFromBatchTag } from '@/lib/utils';

function GalleryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeEra = parseInt(searchParams.get('era') || '2020', 10);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const { data: response, isLoading, error } = useAllMemoriesWithCoordinates();

  // Filter memories by active era; move defaulting logic inside memo to satisfy eslint
  const eraFilteredMemories = useMemo(() => {
    const all: MemoryWithCoordinates[] = response?.data || [];
    return all.filter(
      (memory) =>
        getEraFromBatchTag(memory.tags ?? [], memory.createdAt) === activeEra
    );
  }, [response, activeEra]);

  const handleMemoryClick = (memoryId: string) => {
    router.push(
      `/map?memoryId=${encodeURIComponent(memoryId)}&era=${activeEra}`
    );
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const container = containerRef.current;
    if (!container) return;

    setIsDragging(true);
    startX.current = e.clientX;
    scrollLeft.current = container.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const container = containerRef.current;
    if (!container) return;

    e.preventDefault();
    const x = e.clientX;
    const walk = (x - startX.current) * 1.5;
    container.scrollLeft = scrollLeft.current - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const scrollGallery = (direction: 'left' | 'right') => {
    const container = containerRef.current;
    if (!container) return;

    const scrollAmount = 400;
    const targetScroll =
      direction === 'left'
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scrollGallery('left');
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      scrollGallery('right');
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    if (!container) return;

    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (delta === 0) return;
    e.preventDefault();
    container.scrollLeft += delta;
  };

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <div className="relative flex min-w-0 flex-1">
        {/* Loading/Error States */}
        {isLoading && (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-lg text-gray-600">Loading memories...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-lg text-red-600">
              Failed to load memories. Please try again.
            </p>
          </div>
        )}

        {/* Horizontal gallery with drag scrolling */}
        {!isLoading && !error && (
          <div
            ref={containerRef}
            tabIndex={0}
            className={`scrollbar-hide flex min-w-0 flex-1 select-none flex-row items-center gap-10 overflow-x-auto overflow-y-hidden px-10 py-8 lg:gap-16 lg:px-16 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={
              {
                '--gallery-card-scale':
                  'min(1, calc((100dvh - 2rem) / 640), calc((100vw - 4rem) / 380))',
                scrollBehavior: 'smooth',
                scrollSnapType: 'x mandatory',
                overscrollBehaviorX: 'contain',
              } as React.CSSProperties
            }
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onKeyDown={handleKeyDown}
          >
            {eraFilteredMemories.length === 0 ? (
              <div className="mx-auto">
                <p className="font-dancing text-3xl italic text-gray-500">
                  No memories found for this era
                </p>
              </div>
            ) : (
              eraFilteredMemories.map((memory) => (
                <div
                  key={memory.id}
                  className="shrink-0"
                  style={{
                    scrollSnapAlign: 'center',
                  }}
                >
                  <GalleryMemoryCard
                    memory={memory}
                    onClick={() => handleMemoryClick(memory.id)}
                  />
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GalleryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen flex-col items-center justify-center bg-gray-50">
          <p className="text-lg text-gray-600">Loading gallery...</p>
        </div>
      }
    >
      <GalleryPageContent />
    </Suspense>
  );
}
