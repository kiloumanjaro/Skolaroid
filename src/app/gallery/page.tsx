'use client';

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/header';
import type { MemoryWithCoordinates } from '@/lib/hooks/useAllMemoriesWithCoordinates';
import { GalleryMemoryCard } from '@/components/gallery/GalleryMemoryCard';
import { useAllMemoriesWithCoordinates } from '@/lib/hooks/useAllMemoriesWithCoordinates';
import { getEraFromBatchTag } from '@/lib/utils';

type GalleryStripStyle = CSSProperties & {
  '--gallery-card-scale': string;
};

function GalleryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeEra = parseInt(searchParams.get('era') || '2020', 10);
  const galleryRef = useRef<HTMLDivElement>(null);
  const wheelAnimationFrameRef = useRef<number | null>(null);
  const wheelTargetRef = useRef(0);
  const wheelIdleTimeoutRef = useRef<number | null>(null);
  const dragStateRef = useRef({
    pointerId: null as number | null,
    startX: 0,
    scrollLeft: 0,
    hasMoved: false,
  });
  const suppressClickRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isWheelScrolling, setIsWheelScrolling] = useState(false);

  const { data: response, isLoading, error } = useAllMemoriesWithCoordinates();

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
    router.push(`/map?memoryId=${memoryId}&era=${activeEra}`);
  };

  const stopWheelAnimation = () => {
    if (wheelAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(wheelAnimationFrameRef.current);
      wheelAnimationFrameRef.current = null;
    }
  };

  const clearWheelIdleTimeout = () => {
    if (wheelIdleTimeoutRef.current !== null) {
      window.clearTimeout(wheelIdleTimeoutRef.current);
      wheelIdleTimeoutRef.current = null;
    }
  };

  const clampScrollTarget = (container: HTMLDivElement, value: number) =>
    Math.max(0, Math.min(value, container.scrollWidth - container.clientWidth));

  const animateWheelScroll = () => {
    const container = galleryRef.current;

    if (!container) {
      stopWheelAnimation();
      return;
    }

    const distance = wheelTargetRef.current - container.scrollLeft;

    if (Math.abs(distance) < 0.5) {
      container.scrollLeft = wheelTargetRef.current;
      stopWheelAnimation();
      return;
    }

    container.scrollLeft += distance * 0.18;
    wheelAnimationFrameRef.current =
      window.requestAnimationFrame(animateWheelScroll);
  };

  const finishDrag = () => {
    const container = galleryRef.current;
    const { pointerId, hasMoved } = dragStateRef.current;

    if (
      container &&
      pointerId !== null &&
      container.hasPointerCapture(pointerId)
    ) {
      container.releasePointerCapture(pointerId);
    }

    if (hasMoved) {
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }

    dragStateRef.current = {
      pointerId: null,
      startX: 0,
      scrollLeft: 0,
      hasMoved: false,
    };
    setIsDragging(false);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) {
      return;
    }

    const container = galleryRef.current;

    if (!container) {
      return;
    }

    clearWheelIdleTimeout();
    stopWheelAnimation();
    setIsWheelScrolling(false);
    wheelTargetRef.current = container.scrollLeft;

    dragStateRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      scrollLeft: container.scrollLeft,
      hasMoved: false,
    };

    container.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = galleryRef.current;
    const dragState = dragStateRef.current;

    if (!container || dragState.pointerId !== e.pointerId) {
      return;
    }

    const deltaX = e.clientX - dragState.startX;

    if (!dragState.hasMoved && Math.abs(deltaX) < 6) {
      return;
    }

    if (!dragState.hasMoved) {
      dragState.hasMoved = true;
      setIsDragging(true);
    }

    const nextScrollLeft = clampScrollTarget(
      container,
      dragState.scrollLeft - deltaX
    );
    container.scrollLeft = nextScrollLeft;
    wheelTargetRef.current = nextScrollLeft;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStateRef.current.pointerId !== e.pointerId) {
      return;
    }

    finishDrag();
  };

  const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    suppressClickRef.current = false;
  };

  // Wheel-to-horizontal scroll handler
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    if (!container) return;

    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      return;
    }

    e.preventDefault();
    setIsWheelScrolling(true);
    wheelTargetRef.current = clampScrollTarget(
      container,
      wheelTargetRef.current + e.deltaY * 0.9
    );

    if (wheelAnimationFrameRef.current === null) {
      wheelAnimationFrameRef.current =
        window.requestAnimationFrame(animateWheelScroll);
    }

    clearWheelIdleTimeout();
    wheelIdleTimeoutRef.current = window.setTimeout(() => {
      setIsWheelScrolling(false);
    }, 140);
  };

  useEffect(() => {
    return () => {
      stopWheelAnimation();
      clearWheelIdleTimeout();
    };
  }, []);

  const galleryStripStyle: GalleryStripStyle = {
    scrollBehavior: isDragging || isWheelScrolling ? 'auto' : 'smooth',
    scrollSnapType: isDragging || isWheelScrolling ? 'none' : 'x proximity',
    overscrollBehaviorX: 'contain',
    touchAction: 'pan-y',
    '--gallery-card-scale': 'clamp(0.28, calc((100dvh - 24rem) / 560), 0.48)',
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-gray-50">
      <Header />
      <div className="flex min-h-0 min-w-0 flex-1 pt-16">
        {/* Color Strip - Left Edge */}
        <div className="flex w-2.5 shrink-0 flex-col">
          <div className="flex-1 bg-[#8E1537]" />
          <div className="flex-1 bg-[#FFB81D]" />
          <div className="flex-1 bg-[#005740]" />
          <div className="flex-1 bg-[#7BC122]" />
          <div className="flex-1 bg-[#208CD4]" />
        </div>

        {/* Loading/Error States */}
        {isLoading && (
          <div className="flex min-w-0 flex-1 items-center justify-center">
            <p className="text-lg text-gray-600">Loading memories...</p>
          </div>
        )}

        {error && (
          <div className="flex min-w-0 flex-1 items-center justify-center">
            <p className="text-lg text-red-600">
              Failed to load memories. Please try again.
            </p>
          </div>
        )}

        {/* Horizontal scroll gallery */}
        {!isLoading && !error && (
          <div
            ref={galleryRef}
            className={`scrollbar-hide flex min-w-0 flex-1 items-center gap-8 overflow-x-auto overflow-y-hidden px-8 py-6 md:gap-12 md:px-12 lg:gap-16 lg:px-16 lg:py-8 ${
              isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
            }`}
            style={galleryStripStyle}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={finishDrag}
            onLostPointerCapture={finishDrag}
            onClickCapture={handleClickCapture}
            onDragStart={(e) => e.preventDefault()}
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
                  className="shrink-0"
                  style={{ scrollSnapAlign: 'center' }}
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
        <div className="flex h-dvh flex-col overflow-hidden bg-gray-50">
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
