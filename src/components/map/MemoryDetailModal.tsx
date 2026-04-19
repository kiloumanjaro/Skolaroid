'use client';

import {
  MoreHorizontal,
  Globe,
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  Flag,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { MemoryWithCoordinates } from '@/lib/hooks/useAllMemoriesWithCoordinates';
import { ActionBar } from '@/components/map/ActionBar';
import { DeleteMemoryModal } from '@/components/map/DeleteMemoryModal';
import { ReportMemoryModal } from '@/components/map/ReportMemoryModal';
import { useDeleteMemory } from '@/lib/hooks/useDeleteMemory';
import { CommentSection } from '@/components/map/CommentSection';
import { useCommentsByMemory } from '@/lib/hooks/useCommentsByMemory';
import { useCreateComment } from '@/lib/hooks/useCreateComment';
import { useDeleteComment } from '@/lib/hooks/useDeleteComment';
import { useUserAuth } from '@/lib/hooks/useUserAuth';
import Image from 'next/image';
import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  coverLeftVariants,
  coverRightVariants,
  rightPageFlipVariants,
  leftPageFlipVariants,
  chevronVariants,
  overlayVariants,
  BOOK_OPEN_DURATION,
  BOOK_CLOSE_DURATION,
} from './memory-modal-animations';

interface MemoryDetailModalProps {
  memory: MemoryWithCoordinates | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onMemoryDeleted?: () => void;
}

type AnimationPhase = 'closed' | 'opening' | 'open' | 'closing';

// Page styles shared between left and right pages
const PAGE_BASE_STYLES =
  'flex flex-col gap-4 rounded-xl bg-stone-50 p-6 px-10 shadow-[1px_2px_3px_0px_rgba(0,0,0,0.25)]';

// Styles for absolutely positioned page faces (front/back of flipping pages) - NO SHADOW to prevent stacking
const PAGE_FACE_STYLES =
  'absolute top-0 left-0 w-full h-full flex flex-col gap-4 rounded-xl bg-stone-50 p-6 px-10 overflow-hidden';

// Spine ring component for left page (bar at right edge, circles point inward)
// Each ring scales individually from its center to prevent vertical movement
const LeftPageSpineRings = ({
  shouldScale = false,
  delay = 0,
}: {
  shouldScale?: boolean;
  delay?: number;
}) => (
  <div
    className="pointer-events-none absolute -right-1 top-0 flex h-full flex-col items-end justify-around py-4"
    style={{ transformStyle: 'flat' }}
  >
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="relative flex h-4 w-8 items-center"
        animate={{ scale: shouldScale && i !== 0 ? [1, 1.08, 1] : 1 }}
        transition={{
          duration: 0.5,
          times: [0, 0.3, 1],
          ease: 'easeOut',
          delay,
        }}
        style={{ transformOrigin: 'center center' }}
      >
        {/* Circle pointing inward - positioned so bar edge aligns with circle center */}
        <div className="absolute right-3 h-3.5 w-3.5 rounded-full bg-black" />
        {/* Bar at right edge - rounded only on inner side, on top of circle */}
        <div className="absolute right-0 z-10 h-1.5 w-5 rounded-l bg-zinc-400" />
      </motion.div>
    ))}
  </div>
);

// Spine ring component for right page (bar at left edge, circles point inward)
// Each ring scales individually from its center to prevent vertical movement
const RightPageSpineRings = ({
  shouldScale = false,
  delay = 0,
}: {
  shouldScale?: boolean;
  delay?: number;
}) => (
  <div
    className="pointer-events-none absolute -left-1 top-0 flex h-full flex-col items-start justify-around py-4"
    style={{ transformStyle: 'flat' }}
  >
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="relative flex h-4 w-8 items-center"
        animate={{ scale: shouldScale && i !== 0 ? [1, 1.08, 1] : 1 }}
        transition={{
          duration: 0.5,
          times: [0, 0.3, 1],
          ease: 'easeOut',
          delay,
        }}
        style={{ transformOrigin: 'center center' }}
      >
        {/* Circle pointing inward - positioned so bar edge aligns with circle center */}
        <div className="absolute left-3 h-3.5 w-3.5 rounded-full bg-black" />
        {/* Bar at left edge - rounded only on inner side, on top of circle */}
        <div className="absolute left-0 z-10 h-1.5 w-5 rounded-r bg-zinc-400" />
      </motion.div>
    ))}
  </div>
);

const isAutoTag = (tagName: string): boolean => {
  return (
    /^\d{4}s$/.test(tagName) ||
    /^\d{4}$/.test(tagName) ||
    tagName.startsWith('Near ')
  );
};

export function MemoryDetailModal({
  memory,
  open,
  onOpenChange,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  onMemoryDeleted,
}: MemoryDetailModalProps) {
  const { user: authUser } = useUserAuth();
  const deleteMemory = useDeleteMemory();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const isOwner = !!(
    authUser &&
    memory?.creatorId &&
    memory.creatorId === authUser.id
  );

  const [animationPhase, setAnimationPhase] =
    useState<AnimationPhase>('closed');
  const [isRightPageFlipped, setIsRightPageFlipped] = useState(false);
  const [isLeftPageFlipped, setIsLeftPageFlipped] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  // Cache the old memory during flip animation so flipping page shows old content
  const [cachedMemory, setCachedMemory] =
    useState<MemoryWithCoordinates | null>(null);
  // Track which direction we're flipping for animation state
  type FlipDirection = 'next' | 'prev' | null;
  const [flipDirection, setFlipDirection] = useState<FlipDirection>(null);

  // Handle open/close state changes
  useEffect(() => {
    if (open) {
      // Opening sequence
      setAnimationPhase('opening');
      const timer = setTimeout(() => {
        setAnimationPhase('open');
      }, BOOK_OPEN_DURATION * 1000);
      return () => clearTimeout(timer);
    } else {
      // Closing sequence
      setAnimationPhase('closing');
      const timer = setTimeout(() => {
        setAnimationPhase('closed');
      }, BOOK_CLOSE_DURATION * 1000);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Reset flip state when modal closes
  useEffect(() => {
    if (!open) {
      setIsRightPageFlipped(false);
      setIsLeftPageFlipped(false);
      setIsFlipping(false);
      setCachedMemory(null);
      setFlipDirection(null);
    }
  }, [open]);

  // Handle NEXT: right page flips over to the left, revealing new content underneath
  const handleNext = () => {
    if (!hasNext || isFlipping || !onNext) return;

    // Snapshot comment text and data for the overlay, then clear for the incoming page
    carriedCommentText.current = commentText;
    cachedCommentsRef.current = liveComments;
    cachedCommentCountRef.current = liveCommentCount;
    setCommentText('');

    // Cache current memory and orientation so the flipping page and base left page
    // stay stable while the new image loads
    setCachedMemory(memory);
    setFlipDirection('next');
    setIsFlipping(true);

    // Call onNext immediately - base layer will show NEW content
    onNext();

    // Start the flip animation
    setIsRightPageFlipped(true);

    // After animation completes, clean up
    setTimeout(() => {
      setCachedMemory(null);
      setFlipDirection(null);
      setIsRightPageFlipped(false);
      setIsFlipping(false);
    }, 610);
  };

  // Handle PREVIOUS: left page flips over to the right, revealing new content underneath
  const handlePrevious = () => {
    if (!hasPrevious || isFlipping || !onPrevious) return;

    // Snapshot comment text and data, then clear for the incoming page
    carriedCommentText.current = commentText;
    cachedCommentsRef.current = liveComments;
    cachedCommentCountRef.current = liveCommentCount;
    setCommentText('');

    // Cache current memory and orientation so the flipping page and base left page
    // stay stable while the new image loads
    setCachedMemory(memory);
    setFlipDirection('prev');
    setIsFlipping(true);

    // Call onPrevious immediately - base layer will show NEW content
    onPrevious();

    // Start the flip animation
    setIsLeftPageFlipped(true);

    // After animation completes, clean up
    setTimeout(() => {
      setCachedMemory(null);
      setFlipDirection(null);
      setIsLeftPageFlipped(false);
      setIsFlipping(false);
    }, 610);
  };

  // Helper function to compute date info for a memory
  const getDateInfo = (mem: MemoryWithCoordinates | null) => {
    if (!mem) return null;
    const date = new Date(mem.createdAt || Date.now());
    const currentDay = date.getDay();
    const daysLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - currentDay);

    return {
      dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }),
      month: date.toLocaleDateString('en-US', { month: 'long' }),
      dayNumber: date.getDate(),
      uploadTime: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }),
      calendarWeek: Array.from({ length: 7 }, (_, i) => {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        return {
          label: daysLabels[i],
          number: day.getDate(),
          active: i === currentDay,
        };
      }),
    };
  };

  // Memoize derived date values for current memory
  const dateInfo = useMemo(() => getDateInfo(memory), [memory]);

  // Get date info for cached memory (during flip animation)
  const cachedDateInfo = useMemo(
    () => getDateInfo(cachedMemory),
    [cachedMemory]
  );

  // ── Comment hooks (must be before any early return) ───────────────────────
  const { user } = useUserAuth();
  const {
    data: commentsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCommentsByMemory(memory?.id);
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();
  const [commentText, setCommentText] = useState('');
  const carriedCommentText = useRef('');

  // Derive live comment data (safe to call before early return — just derives from query)
  const liveComments = commentsData?.pages.flatMap((p) => p.data.items) ?? [];
  const liveCommentCount = commentsData?.pages[0]?.data.commentCount ?? 0;

  // Cached comments for flip overlays (same pattern as cachedMemory)
  const cachedCommentsRef = useRef(liveComments);
  const cachedCommentCountRef = useRef(liveCommentCount);

  // Base page always uses live data; overlays use cached snapshots
  const allComments = liveComments;
  const commentCount = liveCommentCount;

  if (!memory || !dateInfo) return null;

  const authorName = memory.creator
    ? `${memory.creator.firstName} ${memory.creator.lastName}`
    : 'Unknown Author';
  const authorInitial = authorName.charAt(0);

  function handleCommentSubmit(content: string) {
    createComment.mutate({ memoryId: memory!.id, content });
    setCommentText('');
  }

  function handleCommentDelete(commentId: string) {
    deleteComment.mutate({ commentId, memoryId: memory!.id });
  }

  // Whether covers should be visible (during open/close animations or closed state)
  const showCovers = animationPhase !== 'open';

  // During a flip, the base page that starts EXPOSED (not yet covered by the overlay)
  // must hold old content so the reveal stays intact until the overlay sweeps over it.
  // - 'next' flip: left base is exposed first → hold old content there
  // - 'prev' flip: right base is exposed first → hold old content there
  const baseLeftDateInfo = (
    isFlipping && flipDirection === 'next' ? cachedDateInfo : dateInfo
  )!;
  const baseLeftMemory = (
    isFlipping && flipDirection === 'next' ? cachedMemory : memory
  )!;
  const baseRightMemory = (
    isFlipping && flipDirection === 'prev' ? cachedMemory : memory
  )!;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <AnimatePresence>
          {open && (
            <DialogPrimitive.Portal forceMount>
              {/* Overlay */}
              <motion.div
                className="fixed inset-0 z-50 bg-[#2d2d2d]/50"
                variants={overlayVariants}
                initial="closed"
                animate="open"
                exit="closed"
                onClick={() => onOpenChange(false)}
              />

              {/* Content Container */}
              <DialogPrimitive.Content asChild forceMount>
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                  <DialogTitle className="sr-only">{memory.title}</DialogTitle>

                  {/* Wrapper with perspective for 3D */}
                  <div
                    className="flex items-center gap-6"
                    style={{ perspective: '2000px' }}
                  >
                    {/* Left chevron */}
                    <motion.button
                      onClick={handlePrevious}
                      disabled={!hasPrevious || isFlipping}
                      className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-border bg-card text-foreground shadow-[3px_3px_0px_0px_#2d2d2d] transition-colors hover:shadow-[4px_4px_0px_0px_#2d2d2d] disabled:cursor-not-allowed disabled:opacity-30"
                      variants={chevronVariants}
                      initial="idle"
                      whileHover={hasPrevious ? 'hover' : 'disabled'}
                      whileTap={hasPrevious ? 'tap' : 'disabled'}
                      aria-label="Previous memory"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </motion.button>

                    {/* Book */}
                    <div
                      className="relative"
                      style={{
                        width: '968px',
                        height: '650px', // Fixed height for the book
                        overflow: 'visible',
                        transformStyle: 'preserve-3d',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="absolute -top-14 right-0 z-30 flex h-10 w-10 items-center justify-center rounded-full border-2 border-border bg-card text-foreground shadow-[3px_3px_0px_0px_#2d2d2d] transition-colors hover:shadow-[4px_4px_0px_0px_#2d2d2d]"
                        aria-label="Close memory details"
                      >
                        <X className="h-5 w-5" />
                      </button>

                      {/* Pages Layer (always visible) */}
                      <div
                        className="absolute inset-0 rounded-2xl bg-sky-200 p-2 shadow-[0px_2px_4px_0px_rgba(0,0,0,0.25)]"
                        style={{
                          overflow: 'visible',
                          transformStyle: 'preserve-3d',
                        }}
                      >
                        {/* Notebook tab */}
                        <div className="absolute -top-5 left-3 rounded-t-md bg-sky-200 px-3 py-0.5">
                          <span className="text-[10px] text-muted-foreground">
                            {memory.location?.buildingName || 'Memory'}
                          </span>
                        </div>

                        {/* Two-page spread */}
                        <div
                          className="relative flex h-full gap-2"
                          style={{
                            transformStyle: 'preserve-3d',
                          }}
                        >
                          {/* BASE LEFT PAGE (shows current/new content) */}
                          <div
                            className={`${PAGE_BASE_STYLES} relative`}
                            style={{
                              width: '472px',
                              zIndex: 1,
                            }}
                          >
                            {/* Date card */}
                            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                              <div>
                                <p className="text-xs font-normal text-skolaroid-blue">
                                  WHEN
                                </p>
                                <p className="text-base font-medium text-black">
                                  {baseLeftDateInfo.dayOfWeek},{' '}
                                  {baseLeftDateInfo.month}{' '}
                                  {baseLeftDateInfo.dayNumber}
                                </p>
                                <p className="text-[8px] text-muted-foreground">
                                  {baseLeftDateInfo.uploadTime.replace(
                                    /:/g,
                                    '-'
                                  )}
                                </p>
                              </div>
                              <div className="flex h-14 w-14 flex-col overflow-hidden rounded-md border border-slate-200 bg-gradient-to-b from-neutral-50/50 to-gray-400/50">
                                <div className="h-3 w-full rounded-t-md bg-skolaroid-blue" />
                                <div className="flex flex-1 items-center justify-center">
                                  <span className="text-2xl font-medium text-black">
                                    {baseLeftDateInfo.dayNumber}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Polaroid photo */}
                            <div className="flex flex-1 items-center justify-center">
                              <div className="w-full">
                                {baseLeftMemory.mediaURL ? (
                                  <div className="border-2 border-border bg-card p-2 pb-8 shadow-[4px_4px_0px_0px_#2d2d2d]">
                                    <div className="relative h-80 w-full overflow-hidden bg-secondary">
                                      <Image
                                        src={baseLeftMemory.mediaURL}
                                        alt={baseLeftMemory.title}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="border-2 border-border bg-card p-2 pb-8 shadow-[4px_4px_0px_0px_#2d2d2d]">
                                    <div className="flex h-80 w-full items-center justify-center bg-secondary">
                                      <span className="text-xs text-muted-foreground">
                                        No image
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Calendar week strip */}
                            <div className="flex items-center justify-center gap-0.5">
                              {baseLeftDateInfo.calendarWeek.map((day) => (
                                <div
                                  key={day.label + day.number}
                                  className="flex h-20 w-14 flex-col items-center overflow-hidden rounded bg-stone-50"
                                >
                                  <span className="mt-1 text-[10px] text-muted-foreground">
                                    {day.label}
                                  </span>
                                  <div className="flex flex-1 items-center justify-center">
                                    {day.active ? (
                                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-skolaroid-blue">
                                        <span className="text-sm font-medium text-white">
                                          {day.number}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-sm font-medium text-foreground">
                                        {day.number}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Spine rings on right edge of left page - scales when right page is flipping */}
                            <LeftPageSpineRings
                              shouldScale={
                                isFlipping && flipDirection === 'next'
                              }
                            />
                          </div>

                          {/* BASE RIGHT PAGE (shows current/new content) */}
                          <div
                            className={`${PAGE_BASE_STYLES} relative`}
                            style={{
                              width: '472px',
                              zIndex: 1,
                            }}
                          >
                            {/* Author header */}
                            <div className="flex items-start gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className="bg-secondary text-sm text-foreground">
                                  {authorInitial}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-foreground">
                                  {authorName}
                                </p>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Globe className="h-3 w-3" />
                                  <span>Public</span>
                                </div>
                              </div>
                              {isOwner ? (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      className="text-muted-foreground hover:text-foreground"
                                      aria-label="More options"
                                    >
                                      <MoreHorizontal className="h-5 w-5" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      className="text-amber-600 focus:text-amber-600"
                                      onClick={() => setReportModalOpen(true)}
                                    >
                                      <Flag className="mr-2 h-4 w-4" />
                                      Report Memory
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-red-600 focus:text-red-600"
                                      onClick={() => setDeleteModalOpen(true)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete Memory
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              ) : (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      className="text-muted-foreground hover:text-foreground"
                                      aria-label="More options"
                                    >
                                      <MoreHorizontal className="h-5 w-5" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      className="text-amber-600 focus:text-amber-600"
                                      onClick={() => setReportModalOpen(true)}
                                    >
                                      <Flag className="mr-2 h-4 w-4" />
                                      Report Memory
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>

                            {/* Caption card */}
                            <div className="rounded-2xl bg-gradient-to-b from-secondary to-secondary p-5 shadow-[0px_1px_2px_0.5px_rgba(0,0,0,0.25)] outline outline-[3px] outline-white">
                              <p className="text-center font-dancing text-2xl leading-relaxed text-foreground">
                                {baseRightMemory.description ||
                                  'A memorable moment...'}
                              </p>
                            </div>

                            {/* Action bar */}
                            <ActionBar
                              memory={baseRightMemory}
                              onReport={() => setReportModalOpen(true)}
                            />

                            {/* Tags section */}
                            {baseRightMemory.tags &&
                              baseRightMemory.tags.length > 0 && (
                                <div className="mt-4">
                                  <h3 className="text-sm font-medium text-muted-foreground">
                                    Tags
                                  </h3>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {baseRightMemory.tags.map((tag) => (
                                      <Badge
                                        key={tag.id}
                                        variant={
                                          isAutoTag(tag.name)
                                            ? 'outline'
                                            : 'secondary'
                                        }
                                      >
                                        {tag.name}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                            {/* Comments section — during prev flip, hold old text on exposed base */}
                            <CommentSection
                              comments={
                                isFlipping && flipDirection === 'prev'
                                  ? cachedCommentsRef.current
                                  : allComments
                              }
                              commentCount={
                                isFlipping && flipDirection === 'prev'
                                  ? cachedCommentCountRef.current
                                  : commentCount
                              }
                              currentUserId={user?.id}
                              hasMore={
                                isFlipping ? false : (hasNextPage ?? false)
                              }
                              isLoadingMore={
                                isFlipping ? false : isFetchingNextPage
                              }
                              isSubmitting={
                                isFlipping ? false : createComment.isPending
                              }
                              onSubmit={
                                isFlipping ? () => {} : handleCommentSubmit
                              }
                              onDelete={
                                isFlipping ? () => {} : handleCommentDelete
                              }
                              onLoadMore={isFlipping ? () => {} : fetchNextPage}
                              commentText={
                                isFlipping && flipDirection === 'prev'
                                  ? carriedCommentText.current
                                  : commentText
                              }
                              onCommentTextChange={
                                isFlipping ? () => {} : setCommentText
                              }
                            />

                            {/* Spine rings on left edge of right page - scales when left page is flipping */}
                            <RightPageSpineRings
                              shouldScale={
                                isFlipping && flipDirection === 'prev'
                              }
                            />
                          </div>

                          {/* ANIMATED LEFT PAGE OVERLAY - shows cached/old content during PREV flip */}
                          {cachedMemory &&
                            cachedDateInfo &&
                            flipDirection === 'prev' && (
                              <motion.div
                                className="absolute top-0"
                                style={{
                                  left: '8px', // Account for container p-2 padding
                                  width: '472px', // (968px - 16px padding - 8px gap) / 2
                                  height: '100%',
                                  transformStyle: 'preserve-3d',
                                  transformOrigin: '472px 50%', // Right edge, center
                                  willChange: 'transform',
                                  zIndex: 20, // Above base pages
                                }}
                                variants={leftPageFlipVariants}
                                initial="flat"
                                animate={isLeftPageFlipped ? 'flipped' : 'flat'}
                              >
                                {/* Front of flipping left page - shows cached/old content */}
                                <div
                                  className={PAGE_FACE_STYLES}
                                  style={{ backfaceVisibility: 'hidden' }}
                                >
                                  {/* Date card - cached content */}
                                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                                    <div>
                                      <p className="text-xs font-normal text-skolaroid-blue">
                                        WHEN
                                      </p>
                                      <p className="text-base font-medium text-black">
                                        {cachedDateInfo.dayOfWeek},{' '}
                                        {cachedDateInfo.month}{' '}
                                        {cachedDateInfo.dayNumber}
                                      </p>
                                      <p className="text-[8px] text-muted-foreground">
                                        {cachedDateInfo.uploadTime.replace(
                                          /:/g,
                                          '-'
                                        )}
                                      </p>
                                    </div>
                                    <div className="flex h-14 w-14 flex-col overflow-hidden rounded-md border border-slate-200 bg-gradient-to-b from-neutral-50/50 to-gray-400/50">
                                      <div className="h-3 w-full rounded-t-md bg-skolaroid-blue" />
                                      <div className="flex flex-1 items-center justify-center">
                                        <span className="text-2xl font-medium text-black">
                                          {cachedDateInfo.dayNumber}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Polaroid photo - cached content */}
                                  <div className="flex flex-1 items-center justify-center">
                                    <div className="w-full">
                                      {cachedMemory.mediaURL ? (
                                        <div className="border-2 border-border bg-card p-2 pb-8 shadow-[4px_4px_0px_0px_#2d2d2d]">
                                          <div className="relative h-80 w-full overflow-hidden bg-secondary">
                                            <Image
                                              src={cachedMemory.mediaURL}
                                              alt={cachedMemory.title}
                                              fill
                                              className="object-cover"
                                            />
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="border-2 border-border bg-card p-2 pb-8 shadow-[4px_4px_0px_0px_#2d2d2d]">
                                          <div className="flex h-80 w-full items-center justify-center bg-secondary">
                                            <span className="text-xs text-muted-foreground">
                                              No image
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Calendar week strip - cached content */}
                                  <div className="flex items-center justify-center gap-0.5">
                                    {cachedDateInfo.calendarWeek.map((day) => (
                                      <div
                                        key={day.label + day.number}
                                        className="flex h-20 w-14 flex-col items-center overflow-hidden rounded bg-stone-50"
                                      >
                                        <span className="mt-1 text-[10px] text-muted-foreground">
                                          {day.label}
                                        </span>
                                        <div className="flex flex-1 items-center justify-center">
                                          {day.active ? (
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-skolaroid-blue">
                                              <span className="text-sm font-medium text-white">
                                                {day.number}
                                              </span>
                                            </div>
                                          ) : (
                                            <span className="text-sm font-medium text-foreground">
                                              {day.number}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Spine rings on right edge */}
                                  <LeftPageSpineRings />
                                </div>
                                {/* Back of flipping left page - shows NEW right content */}
                                <div
                                  className={PAGE_FACE_STYLES}
                                  style={{
                                    transform: 'rotateY(180deg)',
                                    backfaceVisibility: 'hidden',
                                  }}
                                >
                                  {/* Author header */}
                                  <div className="flex items-start gap-3">
                                    <Avatar className="h-9 w-9">
                                      <AvatarFallback className="bg-secondary text-sm text-foreground">
                                        {authorInitial}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-foreground">
                                        {authorName}
                                      </p>
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Globe className="h-3 w-3" />
                                        <span>Public</span>
                                      </div>
                                    </div>
                                    <button
                                      className="text-muted-foreground hover:text-foreground"
                                      aria-label="More options"
                                    >
                                      <MoreHorizontal className="h-5 w-5" />
                                    </button>
                                  </div>

                                  {/* Caption card */}
                                  <div className="rounded-2xl bg-gradient-to-b from-secondary to-secondary p-5 shadow-[0px_1px_2px_0.5px_rgba(0,0,0,0.25)] outline outline-[3px] outline-white">
                                    <p className="text-center font-dancing text-2xl leading-relaxed text-foreground">
                                      {memory.description ||
                                        'A memorable moment...'}
                                    </p>
                                  </div>

                                  {/* Action bar */}
                                  <ActionBar memory={memory} />

                                  {/* Comments section — PREV flip: cached comments, blank input */}
                                  <CommentSection
                                    comments={cachedCommentsRef.current}
                                    commentCount={cachedCommentCountRef.current}
                                    currentUserId={user?.id}
                                    hasMore={false}
                                    isLoadingMore={false}
                                    isSubmitting={false}
                                    onSubmit={() => {}}
                                    onDelete={() => {}}
                                    onLoadMore={() => {}}
                                    commentText=""
                                    onCommentTextChange={() => {}}
                                  />

                                  {/* Spine rings on left edge (back of left page shows right content) */}
                                  <RightPageSpineRings />
                                </div>
                              </motion.div>
                            )}

                          {/* ANIMATED RIGHT PAGE OVERLAY - shows cached/old content during NEXT flip */}
                          {cachedMemory && flipDirection === 'next' && (
                            <motion.div
                              className="absolute top-0"
                              style={{
                                right: '8px', // Account for container p-2 padding
                                width: '472px', // (968px - 16px padding - 8px gap) / 2
                                height: '100%',
                                transformStyle: 'preserve-3d',
                                transformOrigin: '0px 50%', // Left edge, center
                                willChange: 'transform',
                                zIndex: 20, // Above base pages
                              }}
                              variants={rightPageFlipVariants}
                              initial="flat"
                              animate={isRightPageFlipped ? 'flipped' : 'flat'}
                            >
                              {/* Front of flipping right page - shows cached/old content */}
                              <div
                                className={PAGE_FACE_STYLES}
                                style={{ backfaceVisibility: 'hidden' }}
                              >
                                {/* Author header */}
                                <div className="flex items-start gap-3">
                                  <Avatar className="h-9 w-9">
                                    <AvatarFallback className="bg-secondary text-sm text-foreground">
                                      {authorInitial}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-foreground">
                                      {authorName}
                                    </p>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Globe className="h-3 w-3" />
                                      <span>Public</span>
                                    </div>
                                  </div>
                                  <button
                                    className="text-muted-foreground hover:text-foreground"
                                    aria-label="More options"
                                  >
                                    <MoreHorizontal className="h-5 w-5" />
                                  </button>
                                </div>

                                {/* Caption card - cached content */}
                                <div className="rounded-2xl bg-gradient-to-b from-secondary to-secondary p-5 shadow-[0px_1px_2px_0.5px_rgba(0,0,0,0.25)] outline outline-[3px] outline-white">
                                  <p className="text-center font-dancing text-2xl leading-relaxed text-foreground">
                                    {cachedMemory.description ||
                                      'A memorable moment...'}
                                  </p>
                                </div>

                                {/* Action bar */}
                                <ActionBar memory={cachedMemory!} />

                                {/* Comments section — NEXT flip: cached comments, carry snapshotted text */}
                                <CommentSection
                                  comments={cachedCommentsRef.current}
                                  commentCount={cachedCommentCountRef.current}
                                  currentUserId={user?.id}
                                  hasMore={false}
                                  isLoadingMore={false}
                                  isSubmitting={false}
                                  onSubmit={() => {}}
                                  onDelete={() => {}}
                                  onLoadMore={() => {}}
                                  commentText={carriedCommentText.current}
                                  onCommentTextChange={() => {}}
                                />

                                {/* Spine rings on left edge */}
                                <RightPageSpineRings />
                              </div>
                              {/* Back of flipping right page - shows NEW left content */}
                              <div
                                className={PAGE_FACE_STYLES}
                                style={{
                                  transform: 'rotateY(180deg)',
                                  backfaceVisibility: 'hidden',
                                }}
                              >
                                {/* Date card */}
                                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                                  <div>
                                    <p className="text-xs font-normal text-skolaroid-blue">
                                      WHEN
                                    </p>
                                    <p className="text-base font-medium text-black">
                                      {dateInfo.dayOfWeek}, {dateInfo.month}{' '}
                                      {dateInfo.dayNumber}
                                    </p>
                                    <p className="text-[8px] text-muted-foreground">
                                      {dateInfo.uploadTime.replace(/:/g, '-')}
                                    </p>
                                  </div>
                                  <div className="flex h-14 w-14 flex-col overflow-hidden rounded-md border border-slate-200 bg-gradient-to-b from-neutral-50/50 to-gray-400/50">
                                    <div className="h-3 w-full rounded-t-md bg-skolaroid-blue" />
                                    <div className="flex flex-1 items-center justify-center">
                                      <span className="text-2xl font-medium text-black">
                                        {dateInfo.dayNumber}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Polaroid photo */}
                                <div className="flex flex-1 items-center justify-center">
                                  <div className="w-full">
                                    {memory.mediaURL ? (
                                      <div className="border-2 border-border bg-card p-2 pb-8 shadow-[4px_4px_0px_0px_#2d2d2d]">
                                        <div className="relative h-80 w-full overflow-hidden bg-secondary">
                                          <Image
                                            src={memory.mediaURL}
                                            alt={memory.title}
                                            fill
                                            className="object-cover"
                                          />
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="border-2 border-border bg-card p-2 pb-8 shadow-[4px_4px_0px_0px_#2d2d2d]">
                                        <div className="flex h-80 w-full items-center justify-center bg-secondary">
                                          <span className="text-xs text-muted-foreground">
                                            No image
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Calendar week strip */}
                                <div className="flex items-center justify-center gap-0.5">
                                  {dateInfo.calendarWeek.map((day) => (
                                    <div
                                      key={day.label + day.number}
                                      className="flex h-20 w-14 flex-col items-center overflow-hidden rounded bg-stone-50"
                                    >
                                      <span className="mt-1 text-[10px] text-muted-foreground">
                                        {day.label}
                                      </span>
                                      <div className="flex flex-1 items-center justify-center">
                                        {day.active ? (
                                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-skolaroid-blue">
                                            <span className="text-sm font-medium text-white">
                                              {day.number}
                                            </span>
                                          </div>
                                        ) : (
                                          <span className="text-sm font-medium text-foreground">
                                            {day.number}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Spine rings on right edge (back of right page shows left content) */}
                                <LeftPageSpineRings />
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>

                      {/* Covers Layer (visible during open/close animation) */}
                      {showCovers && (
                        <>
                          {/* Left cover */}
                          <motion.div
                            className="absolute left-0 top-0 h-full w-1/2 rounded-l-2xl bg-sky-200 shadow-[0px_4px_8px_0px_rgba(0,0,0,0.3)]"
                            style={{
                              transformOrigin: 'right center',
                              transformStyle: 'preserve-3d',
                            }}
                            variants={coverLeftVariants}
                            initial="closed"
                            animate={animationPhase}
                          >
                            <div
                              className="relative flex h-full items-center justify-center rounded-l-2xl bg-sky-200"
                              style={{ backfaceVisibility: 'hidden' }}
                            >
                              <div className="flex flex-col items-center gap-2">
                                <div className="h-24 w-1 rounded-full bg-sky-300" />
                                <p className="text-xs text-sky-400">Memories</p>
                              </div>
                              {/* Spine connector on right edge */}
                              <div className="pointer-events-none absolute right-0 top-0 flex h-full flex-col items-end justify-around py-4">
                                {[0, 1, 2].map((i) => (
                                  <div
                                    key={i}
                                    className="relative flex h-4 w-7 items-center"
                                  >
                                    <div className="absolute right-0 h-3.5 w-[7px] rounded-r-full bg-sky-400" />
                                    <div className="absolute right-0.5 h-1.5 w-5 rounded-l bg-sky-300" />
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div
                              className="absolute inset-0 rounded-r-2xl bg-sky-100"
                              style={{
                                transform: 'rotateY(180deg)',
                                backfaceVisibility: 'hidden',
                              }}
                            />
                          </motion.div>

                          {/* Right cover */}
                          <motion.div
                            className="absolute right-0 top-0 h-full w-1/2 rounded-r-2xl bg-sky-200 shadow-[0px_4px_8px_0px_rgba(0,0,0,0.3)]"
                            style={{
                              transformOrigin: 'left center',
                              transformStyle: 'preserve-3d',
                            }}
                            variants={coverRightVariants}
                            initial="closed"
                            animate={animationPhase}
                          >
                            <div
                              className="relative flex h-full items-center justify-center rounded-r-2xl bg-sky-200"
                              style={{ backfaceVisibility: 'hidden' }}
                            >
                              <div className="flex flex-col items-center gap-2">
                                <div className="h-24 w-1 rounded-full bg-sky-300" />
                                <p className="text-xs text-sky-400">Book</p>
                              </div>
                              {/* Spine connector on left edge */}
                              <div className="pointer-events-none absolute left-0 top-0 flex h-full flex-col items-start justify-around py-4">
                                {[0, 1, 2].map((i) => (
                                  <div
                                    key={i}
                                    className="relative flex h-4 w-7 items-center"
                                  >
                                    <div className="absolute left-0 h-3.5 w-[7px] rounded-l-full bg-sky-400" />
                                    <div className="absolute left-0.5 h-1.5 w-5 rounded-r bg-sky-300" />
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div
                              className="absolute inset-0 rounded-l-2xl bg-sky-100"
                              style={{
                                transform: 'rotateY(180deg)',
                                backfaceVisibility: 'hidden',
                              }}
                            />
                          </motion.div>
                        </>
                      )}
                    </div>

                    {/* Right chevron */}
                    <motion.button
                      onClick={handleNext}
                      disabled={!hasNext || isFlipping}
                      className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-border bg-card text-foreground shadow-[3px_3px_0px_0px_#2d2d2d] transition-colors hover:shadow-[4px_4px_0px_0px_#2d2d2d] disabled:cursor-not-allowed disabled:opacity-30"
                      variants={chevronVariants}
                      initial="idle"
                      whileHover={hasNext ? 'hover' : 'disabled'}
                      whileTap={hasNext ? 'tap' : 'disabled'}
                      aria-label="Next memory"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </motion.button>
                  </div>
                </div>
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          )}
        </AnimatePresence>
      </Dialog>

      <DeleteMemoryModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        memoryTitle={memory?.title ?? ''}
        isPending={deleteMemory.isPending}
        onConfirmDelete={() => {
          if (!memory) return;
          deleteMemory.mutate(memory.id, {
            onSuccess: () => {
              setDeleteModalOpen(false);
              onOpenChange(false);
              onMemoryDeleted?.();
            },
          });
        }}
      />

      <ReportMemoryModal
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
        memoryId={memory?.id ?? ''}
        memoryTitle={memory?.title ?? ''}
      />
    </>
  );
}
