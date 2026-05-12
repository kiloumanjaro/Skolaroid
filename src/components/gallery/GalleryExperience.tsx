'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { Link2 } from 'lucide-react';
import { GalleryAnnouncementStrip } from '@/components/announcement-strips/GalleryAnnouncementStrip';
import {
  GALLERY_ANNOUNCEMENTS,
  type AnnouncementItem,
} from '@/components/announcement-strips/announcement-config';
import { GalleryMemoryCard } from '@/components/gallery/GalleryMemoryCard';
import { ShellBatchesSidebarAction } from '@/components/shell-batches-sidebar-action';
import type { MemoryWithCoordinates } from '@/lib/hooks/useAllMemoriesWithCoordinates';
import { cn, getEraFromBatchTag } from '@/lib/utils';

interface GalleryExperienceProps {
  activeEra: number;
  memories: MemoryWithCoordinates[];
  isLoading: boolean;
  error?: Error | null;
  onMemoryOpen?: (memoryId: string, imageIndex?: number) => void;
  sharePath?: string;
  emptyMessage?: string;
  isPublicView?: boolean;
  announcements?: AnnouncementItem[];
  showPublicBadge?: boolean;
}

export function GalleryExperience({
  activeEra,
  memories,
  isLoading,
  error,
  onMemoryOpen,
  sharePath = '/share/gallery',
  emptyMessage = 'No memories found',
  isPublicView = false,
  announcements = GALLERY_ANNOUNCEMENTS,
  showPublicBadge = false,
}: GalleryExperienceProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [edgeSpacerWidths, setEdgeSpacerWidths] = useState({
    left: 0,
    right: 0,
  });

  const handleCopyLink = useCallback(async () => {
    const base =
      process.env.NEXT_PUBLIC_APP_URL ??
      (typeof window !== 'undefined' ? window.location.origin : '');
    const url = `${base}${sharePath}?era=${activeEra}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Clipboard access can fail silently on unsupported browsers.
    }
  }, [activeEra, sharePath]);

  const HORIZON_BLOCK = 12;
  const HORIZON_TILE = 200;
  const HORIZON_TILE_PX = HORIZON_TILE * HORIZON_BLOCK;

  const horizonPattern = useMemo<number[]>(() => {
    let s = 0xc0ffee;
    const rand = () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    const MIN = 1;
    const MAX = 5;
    const pattern: number[] = [];
    let cur = 3;
    for (let i = 0; i < HORIZON_TILE; i++) {
      const r = rand();
      let delta: number;
      if (r < 0.38) delta = -1;
      else if (r < 0.76) delta = 1;
      else if (r < 0.88) delta = -2;
      else delta = 2;
      let next = cur + delta;
      if (next < MIN) next = cur + Math.abs(delta);
      if (next > MAX) next = cur - Math.abs(delta);
      next = Math.max(MIN, Math.min(MAX, next));
      if (next === cur) next = cur === MAX ? cur - 1 : cur + 1;
      pattern.push(next);
      cur = next;
    }

    while (Math.abs(pattern[0] - pattern[pattern.length - 1]) > 2) {
      const last = pattern.length - 1;
      pattern[last] += pattern[last] > pattern[0] ? -1 : 1;
    }

    if (pattern[pattern.length - 1] === pattern[0]) {
      pattern[pattern.length - 1] =
        pattern[pattern.length - 1] === MAX
          ? pattern[pattern.length - 1] - 1
          : pattern[pattern.length - 1] + 1;
    }

    return pattern;
  }, []);

  const computeHorizonY = () => {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const scale = Math.min(
      1,
      (window.innerHeight - 2 * rem) / 640,
      (window.innerWidth - 4 * rem) / 380
    );
    return Math.round(460 + 220 * scale);
  };

  const [horizonY, setHorizonY] = useState(680);
  useEffect(() => {
    setHorizonY(computeHorizonY());
    const onResize = () => setHorizonY(computeHorizonY());
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const horizonTileUrl = useMemo(() => {
    if (horizonPattern.length === 0) return 'none';
    const rects = horizonPattern
      .map(
        (v, i) =>
          `<rect x="${i * HORIZON_BLOCK}" y="${horizonY}" width="${HORIZON_BLOCK}" height="${v * HORIZON_BLOCK}" fill="#ffffff"/>`
      )
      .join('');
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${HORIZON_TILE_PX}" height="1000" viewBox="0 0 ${HORIZON_TILE_PX} 1000" preserveAspectRatio="none">` +
      `<rect width="${HORIZON_TILE_PX}" height="${horizonY}" fill="#ffffff"/>` +
      `<rect y="${horizonY}" width="${HORIZON_TILE_PX}" height="${1000 - horizonY}" fill="#abd5f4"/>` +
      rects +
      `</svg>`;
    return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
  }, [horizonPattern, horizonY, HORIZON_BLOCK, HORIZON_TILE_PX]);

  const bgRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const scrollLeftRef = useRef(0);
  const snapChildRefs = useRef<(HTMLDivElement | null)[]>([]);

  const eraFilteredMemories = useMemo(
    () =>
      memories.filter(
        (memory) =>
          getEraFromBatchTag(memory.tags ?? [], memory.createdAt) === activeEra
      ),
    [activeEra, memories]
  );

  const snapScrollLeft = (container: HTMLDivElement, child: HTMLDivElement) =>
    child.offsetLeft + child.offsetWidth / 2 - container.clientWidth / 2;

  const snapScrollLeftToAvatar = useCallback(
    (container: HTMLDivElement, child: HTMLDivElement) => {
      const avatar = child.querySelector('[data-gallery-avatar]');
      if (!(avatar instanceof HTMLElement)) {
        return snapScrollLeft(container, child);
      }

      const childRect = child.getBoundingClientRect();
      const avatarRect = avatar.getBoundingClientRect();
      const avatarCenterWithinChild =
        avatarRect.left - childRect.left + avatarRect.width / 2;

      return (
        child.offsetLeft + avatarCenterWithinChild - container.clientWidth / 2
      );
    },
    []
  );

  const getClosestCardIndex = useCallback((): number => {
    const container = containerRef.current;
    if (!container) return 0;
    const center = container.scrollLeft + container.clientWidth / 2;
    let closest = 0;
    let minDist = Infinity;
    snapChildRefs.current.forEach((el, i) => {
      if (!el) return;
      const dist = Math.abs(el.offsetLeft + el.offsetWidth / 2 - center);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    });
    return closest;
  }, []);

  const scrollToCard = useCallback((index: number) => {
    const container = containerRef.current;
    const child = snapChildRefs.current[index];
    if (!container || !child) return;
    container.scrollTo({
      left: snapScrollLeft(container, child),
      behavior: 'smooth',
    });
  }, []);

  const scrollToCardAvatar = useCallback(
    (index: number) => {
      const container = containerRef.current;
      const child = snapChildRefs.current[index];
      if (!container || !child) return;
      container.scrollTo({
        left: snapScrollLeftToAvatar(container, child),
        behavior: 'smooth',
      });
    },
    [snapScrollLeftToAvatar]
  );

  const hasSingleMemory = eraFilteredMemories.length <= 1;
  const hasWelcomePromo = !hasSingleMemory;
  const firstCardSnapIndex = hasWelcomePromo ? 1 : 0;

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const firstCard = snapChildRefs.current[firstCardSnapIndex];
    if (!firstCard || eraFilteredMemories.length === 0) return;

    const prev = container.style.scrollBehavior;
    container.style.scrollBehavior = 'auto';
    container.scrollLeft = snapScrollLeft(container, firstCard);
    container.style.scrollBehavior = prev;

    if (bgRef.current) {
      bgRef.current.style.backgroundPositionX = `${-(container.scrollLeft % HORIZON_TILE_PX)}px`;
    }
  }, [
    activeEra,
    eraFilteredMemories.length,
    HORIZON_TILE_PX,
    firstCardSnapIndex,
  ]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const firstCard = snapChildRefs.current[firstCardSnapIndex];
    const lastCard =
      snapChildRefs.current[
        eraFilteredMemories.length - 1 + firstCardSnapIndex
      ];

    if (
      !container ||
      eraFilteredMemories.length <= 1 ||
      !firstCard ||
      !lastCard
    ) {
      setEdgeSpacerWidths({ left: 0, right: 0 });
      return;
    }

    const syncSpacerWidths = () => {
      const nextLeft = Math.max(
        firstCard.offsetWidth,
        container.clientWidth * 0.42
      );
      const nextRight = Math.max(
        0,
        (container.clientWidth - lastCard.offsetWidth) / 2
      );

      setEdgeSpacerWidths((current) =>
        current.left === nextLeft && current.right === nextRight
          ? current
          : { left: nextLeft, right: nextRight }
      );
    };

    syncSpacerWidths();

    const observer = new ResizeObserver(syncSpacerWidths);
    observer.observe(container);
    observer.observe(firstCard);
    observer.observe(lastCard);

    return () => observer.disconnect();
  }, [eraFilteredMemories, firstCardSnapIndex]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId: number | null = null;

    const syncBg = () => {
      rafId = null;
      const bg = bgRef.current;
      if (bg) {
        bg.style.backgroundPositionX = `${-(container.scrollLeft % HORIZON_TILE_PX)}px`;
      }
    };

    const onScroll = () => {
      if (rafId === null) rafId = requestAnimationFrame(syncBg);
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      container.removeEventListener('scroll', onScroll);
    };
  }, [HORIZON_TILE_PX]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const container = containerRef.current;
    if (!container) return;

    container.style.scrollBehavior = 'auto';
    container.style.scrollSnapType = 'none';
    setIsDragging(true);
    startX.current = e.clientX;
    scrollLeftRef.current = container.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const container = containerRef.current;
    if (!container) return;

    e.preventDefault();
    const walk = (e.clientX - startX.current) * 1.5;
    container.scrollLeft = scrollLeftRef.current - walk;
  };

  const finishDrag = () => {
    const container = containerRef.current;
    setIsDragging(false);
    if (!container) return;
    container.style.scrollSnapType = '';
    scrollToCard(getClosestCardIndex());
  };

  const scrollGallery = (direction: 'left' | 'right') => {
    const total = eraFilteredMemories.length + (hasWelcomePromo ? 1 : 0);
    if (total === 0) return;
    const currentIdx = getClosestCardIndex();
    const nextIdx =
      direction === 'left'
        ? Math.max(currentIdx - 1, 0)
        : Math.min(currentIdx + 1, total - 1);
    if (nextIdx === currentIdx) return;
    scrollToCard(nextIdx);
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

  return (
    <>
      {!isPublicView && <ShellBatchesSidebarAction era={activeEra} />}

      <div
        ref={bgRef}
        aria-hidden
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -1,
          pointerEvents: 'none',
          backgroundImage: horizonTileUrl,
          backgroundRepeat: 'repeat-x',
          backgroundSize: `${HORIZON_TILE_PX}px 100%`,
          willChange: 'background-position',
        }}
      />

      <div className="relative flex h-full flex-col">
        <GalleryAnnouncementStrip announcements={announcements} />

        <div
          className={cn(
            'pointer-events-none absolute z-30 flex flex-col gap-2',
            isPublicView
              ? 'right-4 top-4 items-end sm:right-6 sm:top-6'
              : 'left-4 top-[6.25rem] items-start sm:left-6 sm:top-32'
          )}
        >
          <div
            className={cn(
              'pointer-events-auto relative',
              isPublicView ? '' : 'mt-0'
            )}
          >
            {showPublicBadge && (
              <span className="pointer-events-auto border-2 border-black bg-[#fff4a8] px-3 py-1 font-hand text-xs uppercase tracking-[0.14em] text-foreground shadow-[2px_2px_0px_0px_#2d2d2d]">
                Public Museum
              </span>
            )}

            <button
              onClick={handleCopyLink}
              aria-label="Copy shareable link"
              type="button"
              className="group relative h-10 w-10 overflow-hidden border-2 border-black bg-card transition-colors sm:h-14 sm:w-14 sm:border-[3px]"
            >
              <div className="absolute inset-0 bg-card transition-all group-hover:bg-[#f6cb48] group-active:bg-[#f6cb48]" />
              <span className="relative flex h-full w-full items-center justify-center text-foreground">
                <Link2 className="h-5 w-5 sm:h-6 sm:w-6" />
              </span>
            </button>

            {copiedLink && (
              <span
                aria-live="polite"
                className={cn(
                  'absolute -bottom-8 whitespace-nowrap border-2 border-black bg-white px-2 py-0.5 font-hand text-xs shadow-[2px_2px_0px_0px_#2d2d2d]',
                  isPublicView ? 'right-0' : 'left-0'
                )}
              >
                Copied!
              </span>
            )}
          </div>
        </div>

        <div className="relative flex min-w-0 flex-1">
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

          {!isLoading && !error && (
            <div
              ref={containerRef}
              tabIndex={0}
              className={`gallery-scroll-container scrollbar-hide flex min-w-0 flex-1 select-none flex-row items-center overflow-x-auto overflow-y-hidden py-4 sm:py-6 ${hasSingleMemory ? 'justify-center' : ''} ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              style={
                {
                  gap: 'var(--gallery-card-gap)',
                  '--gallery-card-scale':
                    'min(1, calc((100dvh - 2rem) / 640), calc((100vw - 4rem) / 380))',
                  scrollBehavior: isDragging ? 'auto' : 'smooth',
                  overscrollBehaviorX: 'contain',
                } as CSSProperties
              }
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={finishDrag}
              onMouseLeave={finishDrag}
              onKeyDown={handleKeyDown}
            >
              {eraFilteredMemories.length === 0 ? (
                <div className="mx-auto max-w-md px-6 text-center">
                  <p className="whitespace-pre-line font-dancing text-3xl italic text-gray-500">
                    {emptyMessage}
                  </p>
                  {isPublicView && (
                    <p className="mt-3 font-hand text-sm text-muted-foreground">
                      Only approved public memories appear in the museum view.
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {hasWelcomePromo && (
                    <div
                      className="flex shrink-0 items-center justify-center"
                      ref={(el) => {
                        snapChildRefs.current[0] = el;
                      }}
                      style={{
                        width: edgeSpacerWidths.left,
                        scrollSnapAlign: 'center',
                      }}
                    >
                      <div className="mx-auto flex flex-col items-center justify-center text-center leading-none text-foreground">
                        <p
                          className="text-3xl font-semibold lowercase tracking-[0.06em] sm:text-4xl lg:text-5xl"
                          style={{ fontFamily: '"Patrick Hand", cursive' }}
                        >
                          welcome to {activeEra}s
                        </p>
                        <p
                          className="mt-3 text-7xl font-normal text-primary sm:text-8xl lg:text-[8.5rem]"
                          style={{ fontFamily: '"Grape Nuts", cursive' }}
                        >
                          Gallery!
                        </p>
                      </div>
                    </div>
                  )}
                  {eraFilteredMemories.map((memory, i) => {
                    const snapIndex = i + firstCardSnapIndex;
                    return (
                      <div
                        key={`${i}-${memory.id}`}
                        ref={(el) => {
                          snapChildRefs.current[snapIndex] = el;
                        }}
                        className="shrink-0"
                        style={{ scrollSnapAlign: 'center' }}
                      >
                        <GalleryMemoryCard
                          memory={memory}
                          index={i}
                          interactive={Boolean(onMemoryOpen)}
                          onClick={(imageIndex) =>
                            onMemoryOpen?.(memory.id, imageIndex ?? 0)
                          }
                          onProfileClick={() => scrollToCardAvatar(snapIndex)}
                        />
                      </div>
                    );
                  })}
                  {!hasSingleMemory && (
                    <div
                      aria-hidden
                      className="shrink-0"
                      style={{ width: edgeSpacerWidths.right }}
                    />
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
