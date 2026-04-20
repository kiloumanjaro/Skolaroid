'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/header';
import type { MemoryWithCoordinates } from '@/lib/hooks/useAllMemoriesWithCoordinates';
import { GalleryMemoryCard } from '@/components/gallery/GalleryMemoryCard';
import { useAllMemoriesWithCoordinates } from '@/lib/hooks/useAllMemoriesWithCoordinates';
import { getEraFromBatchTag } from '@/lib/utils';

function GalleryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeEra = parseInt(searchParams.get('era') || '2020', 10);
  const [isMobile, setIsMobile] = useState(false);

  const { data: response, isLoading, error } = useAllMemoriesWithCoordinates();

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 639px)');
    const updateIsMobile = () => setIsMobile(mediaQuery.matches);

    updateIsMobile();
    mediaQuery.addEventListener('change', updateIsMobile);

    return () => mediaQuery.removeEventListener('change', updateIsMobile);
  }, []);

  // Filter memories by active era; move defaulting logic inside memo to satisfy eslint
  const eraFilteredMemories = useMemo(() => {
    const all: MemoryWithCoordinates[] = response?.data || [];
    return all.filter(
      (memory) =>
        getEraFromBatchTag(memory.tags ?? [], memory.createdAt) === activeEra
    );
  }, [response, activeEra]);

  // Era badge styling (matching map ERA_OVERLAY)
  const ERA_STYLES: Record<number, { label: string; badge: string }> = {
    2020: {
      label: '2020s',
      badge: 'bg-sky-100 text-sky-800 border-sky-200',
    },
    2010: {
      label: '2010s',
      badge: 'bg-slate-100 text-slate-700 border-slate-200',
    },
    2000: {
      label: '2000s',
      badge: 'bg-green-100 text-green-800 border-green-200',
    },
    1990: {
      label: '1990s',
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    1980: {
      label: '1980s',
      badge: 'bg-orange-100 text-orange-800 border-orange-200',
    },
    1970: {
      label: '1970s',
      badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
    1960: {
      label: '1960s',
      badge: 'bg-stone-100 text-stone-700 border-stone-200',
    },
    1950: {
      label: '1950s',
      badge: 'bg-stone-100 text-stone-700 border-stone-200',
    },
    1940: {
      label: '1940s',
      badge: 'bg-stone-100 text-stone-700 border-stone-200',
    },
  };

  const currentEraStyle = ERA_STYLES[activeEra] || ERA_STYLES[2020];

  const handleMemoryClick = (memoryId: string) => {
    router.push(
      `/map?memoryId=${encodeURIComponent(memoryId)}&era=${activeEra}`
    );
  };

  // Wheel-to-horizontal scroll handler
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    if (!container) return;
    if (isMobile) return;

    // Translate wheel movement to horizontal scroll for easier gallery navigation.
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (delta === 0) return;
    e.preventDefault();
    container.scrollLeft += delta;
  };

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <Header />
      <div className="flex min-w-0 flex-1 pt-16">
        {/* Color Strip - Left Edge */}
        <div className="flex w-2.5 shrink-0 flex-col">
          <div className="flex-1 bg-[#8E1537]" />
          <div className="flex-1 bg-[#FFB81D]" />
          <div className="flex-1 bg-[#005740]" />
          <div className="flex-1 bg-[#7BC122]" />
          <div className="flex-1 bg-[#208CD4]" />
        </div>

        {/* Era badge */}
        <div className="absolute left-4 right-4 top-20 z-20 sm:left-6 sm:right-auto">
          <div
            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold shadow-md backdrop-blur-sm ${currentEraStyle.badge}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
            {currentEraStyle.label} Gallery
          </div>
        </div>

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

        {/* Responsive gallery: vertical on phones, horizontal from sm upward */}
        {!isLoading && !error && (
          <div
            className="scrollbar-hide flex min-w-0 flex-1 flex-col items-center gap-8 overflow-y-auto overflow-x-hidden px-4 py-6 sm:flex-row sm:items-center sm:gap-10 sm:overflow-x-auto sm:overflow-y-hidden sm:px-10 sm:py-8 lg:gap-16 lg:px-16"
            style={{
              scrollBehavior: 'smooth',
              scrollSnapType: isMobile ? 'y proximity' : 'x mandatory',
              overscrollBehaviorX: isMobile ? 'auto' : 'contain',
              overscrollBehaviorY: isMobile ? 'contain' : 'auto',
            }}
            onWheel={handleWheel}
          >
            {eraFilteredMemories.length === 0 ? (
              <div className="mx-auto">
                <p className="font-dancing text-3xl italic text-gray-500">
                  No memories found for the {currentEraStyle.label}
                </p>
              </div>
            ) : (
              eraFilteredMemories.map((memory) => (
                <div
                  key={memory.id}
                  className="w-full max-w-[40rem] shrink-0"
                  style={{
                    scrollSnapAlign: isMobile ? 'start' : 'center',
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
        <div className="flex h-screen flex-col bg-gray-50">
          <Header />
          <div className="flex flex-1 items-center justify-center pt-16">
            <p className="text-lg text-gray-600">Loading gallery...</p>
          </div>
        </div>
      }
    >
      <GalleryPageContent />
    </Suspense>
  );
}
