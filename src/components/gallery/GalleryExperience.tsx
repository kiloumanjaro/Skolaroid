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
import { GalleryMemoryCard } from '@/components/gallery/GalleryMemoryCard';
import { ShellBatchesSidebarAction } from '@/components/shell-batches-sidebar-action';
import type { MemoryWithCoordinates } from '@/lib/hooks/useAllMemoriesWithCoordinates';
import { cn, getEraFromBatchTag } from '@/lib/utils';

const CLONE_COUNT = 3;
const DEFAULT_ANNOUNCEMENTS = [
  'Flip through campus memories one era at a time',
  'Every card is a moment pinned to a shared history',
  'Open any photo to jump straight back into the map',
];

interface GalleryExperienceProps {
  activeEra: number;
  memories: MemoryWithCoordinates[];
  isLoading: boolean;
  error?: Error | null;
  onMemoryOpen?: (memoryId: string, imageIndex?: number) => void;
  sharePath?: string;
  emptyMessage?: string;
  isPublicView?: boolean;
  announcements?: string[];
  showPublicBadge?: boolean;
}

export function GalleryExperience({
  activeEra,
  memories,
  isLoading,
  error,
  onMemoryOpen,
  sharePath = '/share/gallery',
  emptyMessage = 'No memories found for this era',
  isPublicView = false,
  announcements = DEFAULT_ANNOUNCEMENTS,
  showPublicBadge = false,
}: GalleryExperienceProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

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
  const isTeleporting = useRef(false);
  const wheelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const eraFilteredMemories = useMemo(
    () =>
      memories.filter(
        (memory) =>
          getEraFromBatchTag(memory.tags ?? [], memory.createdAt) === activeEra
      ),
    [activeEra, memories]
  );

  const [extendedMemories, cloneCount] = useMemo(() => {
    const items = eraFilteredMemories;
    if (items.length === 0) return [[], 0] as [MemoryWithCoordinates[], number];
    const n = Math.min(CLONE_COUNT, items.length);
    return [[...items.slice(-n), ...items, ...items.slice(0, n)], n] as [
      MemoryWithCoordinates[],
      number,
    ];
  }, [eraFilteredMemories]);

  const totalReal = eraFilteredMemories.length;

  const snapScrollLeft = (container: HTMLDivElement, child: HTMLDivElement) =>
    child.offsetLeft + child.offsetWidth / 2 - container.clientWidth / 2;

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

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || totalReal === 0) return;
    const firstReal = snapChildRefs.current[cloneCount];
    if (!firstReal) return;
    const prev = container.style.scrollBehavior;
    container.style.scrollBehavior = 'auto';
    container.scrollLeft = snapScrollLeft(container, firstReal);
    container.style.scrollBehavior = prev;
    if (bgRef.current) {
      bgRef.current.style.backgroundPositionX = `${-(container.scrollLeft % HORIZON_TILE_PX)}px`;
    }
  }, [cloneCount, totalReal, HORIZON_TILE_PX]);

  const teleportIfOnClone = useCallback(() => {
    const container = containerRef.current;
    if (!container || totalReal === 0 || isTeleporting.current) return;

    const firstReal = snapChildRefs.current[cloneCount];
    const firstPostClone = snapChildRefs.current[cloneCount + totalReal];
    if (!firstReal || !firstPostClone) return;

    const viewportCenter = container.scrollLeft + container.clientWidth / 2;
    let closestIndex = -1;
    let closestDist = Infinity;
    for (let i = 0; i < snapChildRefs.current.length; i++) {
      const ref = snapChildRefs.current[i];
      if (!ref) continue;
      const dist = Math.abs(
        ref.offsetLeft + ref.offsetWidth / 2 - viewportCenter
      );
      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = i;
      }
    }

    if (closestIndex < 0) return;
    if (closestIndex >= cloneCount && closestIndex < cloneCount + totalReal) {
      return;
    }

    const stride = firstPostClone.offsetLeft - firstReal.offsetLeft;
    const delta = closestIndex < cloneCount ? stride : -stride;

    isTeleporting.current = true;
    const prev = container.style.scrollBehavior;
    container.style.scrollBehavior = 'auto';
    container.scrollLeft += delta;
    container.style.scrollBehavior = prev;
    requestAnimationFrame(() => {
      isTeleporting.current = false;
    });
  }, [cloneCount, totalReal]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    const SETTLE_MS = 120;
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
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(teleportIfOnClone, SETTLE_MS);
    };

    const onScrollEnd = () => {
      if (idleTimer) clearTimeout(idleTimer);
      teleportIfOnClone();
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    container.addEventListener('scrollend', onScrollEnd);
    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      if (rafId !== null) cancelAnimationFrame(rafId);
      container.removeEventListener('scroll', onScroll);
      container.removeEventListener('scrollend', onScrollEnd);
    };
  }, [teleportIfOnClone, HORIZON_TILE_PX]);

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
    const total = snapChildRefs.current.length;
    if (total === 0) return;
    const currentIdx = getClosestCardIndex();
    const nextIdx =
      direction === 'left'
        ? (currentIdx - 1 + total) % total
        : (currentIdx + 1) % total;
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

  const handleWheel = () => {
    const container = containerRef.current;
    if (!container) return;

    container.style.scrollSnapType = 'none';

    if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current);
    wheelTimeoutRef.current = setTimeout(() => {
      container.style.scrollSnapType = '';
      scrollToCard(getClosestCardIndex());
    }, 150);
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

      <div className="flex h-full flex-col">
        <GalleryAnnouncementStrip announcements={announcements} />

        <div className="relative flex min-w-0 flex-1">
          <div className="pointer-events-none absolute right-4 top-4 z-10 flex flex-col items-end gap-2 sm:right-6 sm:top-6">
            {showPublicBadge && (
              <span className="pointer-events-auto border-2 border-black bg-[#fff4a8] px-3 py-1 font-hand text-xs uppercase tracking-[0.14em] text-foreground shadow-[2px_2px_0px_0px_#2d2d2d]">
                Public Museum
              </span>
            )}

            <div className="pointer-events-auto relative">
              <button
                onClick={handleCopyLink}
                aria-label="Copy shareable link"
                className={cn(
                  'flex aspect-square items-center justify-center gap-2 border-2 border-black bg-white p-1.5 font-hand text-sm transition-[box-shadow,transform] duration-75 sm:aspect-auto sm:px-4 sm:py-1.5',
                  'shadow-[4px_4px_0px_0px_#2d2d2d]',
                  'hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#2d2d2d]',
                  'active:translate-x-[4px] active:translate-y-[4px] active:shadow-none'
                )}
              >
                <span className="hidden sm:inline">
                  {copiedLink ? 'Copied!' : 'Copy Link'}
                </span>
                <Link2 className="h-4 w-4" />
              </button>

              {copiedLink && (
                <span
                  aria-live="polite"
                  className="absolute -bottom-8 right-0 whitespace-nowrap border-2 border-black bg-white px-2 py-0.5 font-hand text-xs shadow-[2px_2px_0px_0px_#2d2d2d]"
                >
                  Link copied!
                </span>
              )}
            </div>
          </div>

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
              className={`gallery-scroll-container scrollbar-hide flex min-w-0 flex-1 select-none flex-row items-center overflow-x-auto overflow-y-hidden py-8 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              style={
                {
                  gap: 'var(--gallery-card-gap)',
                  '--gallery-card-scale':
                    'min(1, calc((100dvh - 2rem) / 640), calc((100vw - 4rem) / 380))',
                  scrollBehavior: isDragging ? 'auto' : 'smooth',
                  overscrollBehaviorX: 'contain',
                } as CSSProperties
              }
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={finishDrag}
              onMouseLeave={finishDrag}
              onKeyDown={handleKeyDown}
            >
              {eraFilteredMemories.length === 0 ? (
                <div className="mx-auto max-w-md px-6 text-center">
                  <p className="font-dancing text-3xl italic text-gray-500">
                    {emptyMessage}
                  </p>
                  {isPublicView && (
                    <p className="mt-3 font-hand text-sm text-muted-foreground">
                      Only approved public memories appear in the museum view.
                    </p>
                  )}
                </div>
              ) : (
                extendedMemories.map((memory, i) => {
                  const isPreClone = i < cloneCount;
                  const isPostClone = i >= cloneCount + totalReal;
                  const realIndex = isPreClone
                    ? totalReal - cloneCount + i
                    : isPostClone
                      ? i - cloneCount - totalReal
                      : i - cloneCount;

                  return (
                    <div
                      key={`${i}-${memory.id}`}
                      ref={(el) => {
                        snapChildRefs.current[i] = el;
                      }}
                      className="shrink-0"
                      style={{ scrollSnapAlign: 'center' }}
                    >
                      <GalleryMemoryCard
                        memory={memory}
                        index={realIndex}
                        interactive={Boolean(onMemoryOpen)}
                        onClick={(imageIndex) =>
                          onMemoryOpen?.(memory.id, imageIndex ?? 0)
                        }
                      />
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
