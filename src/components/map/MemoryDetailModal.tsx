'use client';

import {
  MoreHorizontal,
  Globe,
  GraduationCap,
  Users,
  Lock,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  X,
  Trash2,
  Flag,
  User,
  Pencil,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { EditMemoryModal } from '@/components/map/EditMemoryModal';
import { ReportMemoryModal } from '@/components/map/ReportMemoryModal';
import { useDeleteMemory } from '@/lib/hooks/useDeleteMemory';
import { CommentSection } from '@/components/map/CommentSection';
import { useCommentsByMemory } from '@/lib/hooks/useCommentsByMemory';
import { useCreateComment } from '@/lib/hooks/useCreateComment';
import { useDeleteComment } from '@/lib/hooks/useDeleteComment';
import { useUserAuth } from '@/lib/hooks/useUserAuth';
import { useUserGroups } from '@/lib/hooks/useUserGroups';
import {
  getMemoryMediaURLs,
  getPrimaryMemoryMediaURL,
} from '@/lib/memory-media';
import type { MemoryVisibility } from '@/lib/schemas';
import Image from 'next/image';
import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  type TouchEvent,
} from 'react';
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
  previousMemory?: MemoryWithCoordinates | null;
  nextMemory?: MemoryWithCoordinates | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onMemoryDeleted?: () => void;
}

type AnimationPhase = 'closed' | 'opening' | 'open' | 'closing';
type FlipDirection = 'next' | 'prev' | null;
type MobileNotebookPage = 'photo' | 'comments';
type MobileTransitionMode = 'page' | 'memory' | null;

interface MemoryDateInfo {
  dayOfWeek: string;
  month: string;
  dayNumber: number;
  uploadTime: string;
}

const PAGE_BASE_STYLES =
  'flex flex-col gap-4 overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,#fdfbf7_100%)] p-6 px-10 shadow-[inset_0_0_0_2px_rgba(18,18,18,0.85),inset_0_18px_30px_rgba(255,255,255,0.6)]';

const PAGE_FACE_STYLES =
  'absolute top-0 left-0 flex h-full w-full flex-col gap-4 overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,#fdfbf7_100%)] p-6 px-10 shadow-[inset_0_0_0_2px_rgba(18,18,18,0.85),inset_0_18px_30px_rgba(255,255,255,0.6)]';

const BOOK_WIDTH = 968;
const BOOK_HEIGHT = 650;
const PAGE_WIDTH = 472;
const BOOK_INNER_PADDING = 8;
const NOTEBOOK_BORDER_COLOR = '#2d2d2d';
const NOTEBOOK_COVER_COLOR = '#91a8ec';
const NOTEBOOK_SPRING_COLOR = '#d9d9d9';
const NOTEBOOK_SPRING_BORDER_COLOR = '#2b2b2b';
const NOTEBOOK_SPINE_RING_WIDTH = 26;
const NOTEBOOK_SPINE_RING_HEIGHT = 14;
const NOTEBOOK_SPINE_CONNECTOR_WIDTH = 18;
const MOBILE_BREAKPOINT = 768;
const MOBILE_VISIBLE_BOOK_WIDTH = 520;
const MOBILE_BOOK_TOP_OFFSET = 24;
const MOBILE_LAYOUT_WIDTH_GUTTER = 24;
const MOBILE_LAYOUT_HEIGHT_GUTTER = 220;
const MOBILE_MIN_STAGE_WIDTH = 280;
const PAGE_TURN_DURATION_MS = 610;

const LeftPageSpineRings = ({
  shouldScale = false,
  delay = 0,
}: {
  shouldScale?: boolean;
  delay?: number;
}) => (
  <div
    className="pointer-events-none absolute -right-[6px] top-0 flex h-full flex-col items-end justify-around py-[18px]"
    style={{ transformStyle: 'flat' }}
  >
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="relative"
        animate={{ scale: shouldScale && i !== 0 ? [1, 1.08, 1] : 1 }}
        transition={{
          duration: 0.5,
          times: [0, 0.3, 1],
          ease: 'easeOut',
          delay,
        }}
        style={{ transformOrigin: 'center center' }}
      >
        <div
          className="rounded-[8px] border-2"
          style={{
            width: `${NOTEBOOK_SPINE_RING_WIDTH}px`,
            height: `${NOTEBOOK_SPINE_RING_HEIGHT}px`,
            borderColor: NOTEBOOK_SPRING_BORDER_COLOR,
            backgroundColor: NOTEBOOK_SPRING_COLOR,
          }}
        />
      </motion.div>
    ))}
  </div>
);

const RightPageSpineRings = ({
  shouldScale = false,
  delay = 0,
}: {
  shouldScale?: boolean;
  delay?: number;
}) => (
  <div
    className="pointer-events-none absolute -left-[6px] top-0 flex h-full flex-col items-start justify-around py-[18px]"
    style={{ transformStyle: 'flat' }}
  >
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="relative"
        animate={{ scale: shouldScale && i !== 0 ? [1, 1.08, 1] : 1 }}
        transition={{
          duration: 0.5,
          times: [0, 0.3, 1],
          ease: 'easeOut',
          delay,
        }}
        style={{ transformOrigin: 'center center' }}
      >
        <div
          className="rounded-[8px] border-2"
          style={{
            width: `${NOTEBOOK_SPINE_RING_WIDTH}px`,
            height: `${NOTEBOOK_SPINE_RING_HEIGHT}px`,
            borderColor: NOTEBOOK_SPRING_BORDER_COLOR,
            backgroundColor: NOTEBOOK_SPRING_COLOR,
          }}
        />
      </motion.div>
    ))}
  </div>
);

const NotebookSpineConnectors = () => (
  <div
    className="pointer-events-none absolute inset-y-0 left-1/2 z-10 flex -translate-x-1/2 flex-col justify-around py-[18px]"
    style={{ width: `${NOTEBOOK_SPINE_CONNECTOR_WIDTH}px` }}
    aria-hidden="true"
  >
    {[0, 1, 2].map((i) => (
      <div key={i} className="flex items-center justify-center">
        <div
          className="w-full border-y-2"
          style={{
            height: `${NOTEBOOK_SPINE_RING_HEIGHT}px`,
            borderColor: NOTEBOOK_BORDER_COLOR,
            backgroundColor: NOTEBOOK_SPRING_COLOR,
          }}
        />
      </div>
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

const VISIBILITY_META: Record<
  MemoryVisibility,
  { Icon: typeof Globe; label: string }
> = {
  PUBLIC: { Icon: Globe, label: 'Public' },
  PROGRAM_ONLY: { Icon: GraduationCap, label: 'Program Only' },
  BATCH_ONLY: { Icon: Users, label: 'Batch Only' },
  GROUP_ONLY: { Icon: Lock, label: 'Private' },
  PRIVATE: { Icon: Lock, label: 'Private' },
};

type MemoryMediaShape = Pick<
  MemoryWithCoordinates,
  'id' | 'title' | 'mediaURLs'
>;
const SWIPE_THRESHOLD_PX = 48;

interface PolaroidMediaCarouselProps {
  memory: MemoryMediaShape;
  activeIndex: number;
  onIndexChange?: (nextIndex: number) => void;
  showControls?: boolean;
}

function PolaroidMediaCarousel({
  memory,
  activeIndex,
  onIndexChange,
  showControls = true,
}: PolaroidMediaCarouselProps) {
  const mediaURLs = getMemoryMediaURLs(memory);
  const hasMedia = mediaURLs.length > 0;
  const canNavigate = showControls && mediaURLs.length > 1 && !!onIndexChange;

  const safeIndex =
    mediaURLs.length > 0
      ? ((activeIndex % mediaURLs.length) + mediaURLs.length) % mediaURLs.length
      : 0;

  const touchStartXRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef(0);

  const goToIndex = useCallback(
    (nextIndex: number) => {
      if (!onIndexChange || mediaURLs.length === 0) return;

      const wrappedIndex =
        ((nextIndex % mediaURLs.length) + mediaURLs.length) % mediaURLs.length;
      onIndexChange(wrappedIndex);
    },
    [onIndexChange, mediaURLs.length]
  );

  const handleTouchStart = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (!canNavigate) return;

      touchStartXRef.current = event.touches[0]?.clientX ?? null;
      touchDeltaXRef.current = 0;
    },
    [canNavigate]
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (!canNavigate || touchStartXRef.current === null) return;

      const currentX = event.touches[0]?.clientX ?? touchStartXRef.current;
      touchDeltaXRef.current = currentX - touchStartXRef.current;
    },
    [canNavigate]
  );

  const handleTouchEnd = useCallback(() => {
    if (!canNavigate) return;

    if (Math.abs(touchDeltaXRef.current) >= SWIPE_THRESHOLD_PX) {
      if (touchDeltaXRef.current < 0) {
        goToIndex(safeIndex + 1);
      } else {
        goToIndex(safeIndex - 1);
      }
    }

    touchStartXRef.current = null;
    touchDeltaXRef.current = 0;
  }, [canNavigate, goToIndex, safeIndex]);

  return (
    <div className="w-full">
      {hasMedia ? (
        <div className="border-2 border-black bg-white px-[10px] pb-[60px] pt-[10px]">
          <div
            className="relative h-[28rem] w-full overflow-hidden border border-black bg-neutral-100"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Image
              src={mediaURLs[safeIndex]}
              alt={`${memory.title} image ${safeIndex + 1}`}
              fill
              className="object-cover"
            />
          </div>
        </div>
      ) : (
        <div className="border-2 border-black bg-white px-[10px] pb-[60px] pt-[10px]">
          <div className="flex h-[28rem] w-full items-center justify-center border border-black bg-neutral-100">
            <span className="text-xl text-muted-foreground">No image</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function MemoryDetailModal({
  memory,
  previousMemory = null,
  nextMemory = null,
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
  const { data: userGroups } = useUserGroups();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [animationPhase, setAnimationPhase] =
    useState<AnimationPhase>('closed');
  const [isRightPageFlipped, setIsRightPageFlipped] = useState(false);
  const [isLeftPageFlipped, setIsLeftPageFlipped] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [cachedMemory, setCachedMemory] =
    useState<MemoryWithCoordinates | null>(null);
  const [activeImageIndexByMemoryId, setActiveImageIndexByMemoryId] = useState<
    Record<string, number>
  >({});
  const [flipDirection, setFlipDirection] = useState<FlipDirection>(null);

  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [mobileBookScale, setMobileBookScale] = useState(1);
  const [mobileBookStageWidth, setMobileBookStageWidth] = useState(
    MOBILE_VISIBLE_BOOK_WIDTH
  );
  const [mobileNotebookPage, setMobileNotebookPage] =
    useState<MobileNotebookPage>('photo');
  const [isMobilePageTurning, setIsMobilePageTurning] = useState(false);
  const [mobileTransitionDirection, setMobileTransitionDirection] =
    useState<FlipDirection>(null);
  const [mobileTransitionMode, setMobileTransitionMode] =
    useState<MobileTransitionMode>(null);
  const [mobileTransitionMemory, setMobileTransitionMemory] =
    useState<MemoryWithCoordinates | null>(null);

  const getActiveImageIndex = useCallback(
    (mem: MemoryWithCoordinates | null) => {
      if (!mem) return 0;

      const mediaURLs = getMemoryMediaURLs(mem);
      if (mediaURLs.length === 0) return 0;

      const rawIndex = activeImageIndexByMemoryId[mem.id] ?? 0;
      return Math.min(Math.max(rawIndex, 0), mediaURLs.length - 1);
    },
    [activeImageIndexByMemoryId]
  );

  const handleImageIndexChange = useCallback(
    (memoryId: string, nextIndex: number) => {
      setActiveImageIndexByMemoryId((prev) => {
        if (prev[memoryId] === nextIndex) return prev;
        return { ...prev, [memoryId]: nextIndex };
      });
    },
    []
  );
  useEffect(() => {
    if (open) {
      setAnimationPhase('opening');
      const timer = setTimeout(() => {
        setAnimationPhase('open');
      }, BOOK_OPEN_DURATION * 1000);
      return () => clearTimeout(timer);
    }

    setAnimationPhase('closing');
    const timer = setTimeout(() => {
      setAnimationPhase('closed');
    }, BOOK_CLOSE_DURATION * 1000);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setIsRightPageFlipped(false);
      setIsLeftPageFlipped(false);
      setIsFlipping(false);
      setCachedMemory(null);
      setFlipDirection(null);
      setMobileNotebookPage('photo');
      setIsMobilePageTurning(false);
      setMobileTransitionDirection(null);
      setMobileTransitionMode(null);
      setMobileTransitionMemory(null);
      setActiveImageIndexByMemoryId({});
    }
  }, [open]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateMobileLayout = () => {
      const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobileViewport(isMobile);

      if (!isMobile) {
        setMobileBookScale(1);
        setMobileBookStageWidth(MOBILE_VISIBLE_BOOK_WIDTH);
        return;
      }

      const availableWidth = Math.max(
        window.innerWidth - MOBILE_LAYOUT_WIDTH_GUTTER,
        MOBILE_MIN_STAGE_WIDTH
      );
      const availableHeight = Math.max(
        window.innerHeight - MOBILE_LAYOUT_HEIGHT_GUTTER,
        360
      );
      const visibleBookWidth = Math.min(
        availableWidth,
        MOBILE_VISIBLE_BOOK_WIDTH
      );
      const scale = Math.min(
        1,
        visibleBookWidth / MOBILE_VISIBLE_BOOK_WIDTH,
        availableHeight / BOOK_HEIGHT
      );

      setMobileBookStageWidth(availableWidth);
      setMobileBookScale(scale);
    };

    updateMobileLayout();
    window.addEventListener('resize', updateMobileLayout);
    return () => window.removeEventListener('resize', updateMobileLayout);
  }, []);

  const getDateInfo = (
    mem: MemoryWithCoordinates | null
  ): MemoryDateInfo | null => {
    if (!mem) return null;

    const date = new Date(mem.createdAt || Date.now());

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
    };
  };

  const dateInfo = useMemo(() => getDateInfo(memory), [memory]);
  const cachedDateInfo = useMemo(
    () => getDateInfo(cachedMemory),
    [cachedMemory]
  );
  const previousDateInfo = useMemo(
    () => getDateInfo(previousMemory),
    [previousMemory]
  );
  const nextDateInfo = useMemo(() => getDateInfo(nextMemory), [nextMemory]);

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

  const liveComments = commentsData?.pages.flatMap((p) => p.data.items) ?? [];
  const liveCommentCount = commentsData?.pages[0]?.data.commentCount ?? 0;

  const cachedCommentsRef = useRef(liveComments);
  const cachedCommentCountRef = useRef(liveCommentCount);
  const mobileCachedCommentsRef = useRef(liveComments);
  const mobileCachedCommentCountRef = useRef(liveCommentCount);
  const mobileCarriedCommentText = useRef('');

  useEffect(() => {
    setMobileNotebookPage('photo');
    setIsMobilePageTurning(false);
    setMobileTransitionDirection(null);
    setMobileTransitionMode(null);
    setMobileTransitionMemory(null);
    setCommentText('');
  }, [memory?.id]);

  if (!memory || !dateInfo) return null;

  const handleNext = () => {
    if (!hasNext || isFlipping || !onNext) return;

    carriedCommentText.current = commentText;
    cachedCommentsRef.current = liveComments;
    cachedCommentCountRef.current = liveCommentCount;
    setCommentText('');

    setCachedMemory(memory);
    setFlipDirection('next');
    setIsFlipping(true);
    onNext();
    setIsRightPageFlipped(true);

    setTimeout(() => {
      setCachedMemory(null);
      setFlipDirection(null);
      setIsRightPageFlipped(false);
      setIsFlipping(false);
    }, PAGE_TURN_DURATION_MS);
  };

  const handlePrevious = () => {
    if (!hasPrevious || isFlipping || !onPrevious) return;

    carriedCommentText.current = commentText;
    cachedCommentsRef.current = liveComments;
    cachedCommentCountRef.current = liveCommentCount;
    setCommentText('');

    setCachedMemory(memory);
    setFlipDirection('prev');
    setIsFlipping(true);
    onPrevious();
    setIsLeftPageFlipped(true);

    setTimeout(() => {
      setCachedMemory(null);
      setFlipDirection(null);
      setIsLeftPageFlipped(false);
      setIsFlipping(false);
    }, PAGE_TURN_DURATION_MS);
  };

  const handleMobileShowComments = () => {
    if (mobileNotebookPage !== 'photo' || isMobilePageTurning) return;

    carriedCommentText.current = commentText;
    cachedCommentsRef.current = liveComments;
    cachedCommentCountRef.current = liveCommentCount;
    mobileCarriedCommentText.current = commentText;
    mobileCachedCommentsRef.current = liveComments;
    mobileCachedCommentCountRef.current = liveCommentCount;

    setMobileTransitionDirection('next');
    setMobileTransitionMode('page');
    setIsMobilePageTurning(true);

    setTimeout(() => {
      setMobileNotebookPage('comments');
      setIsMobilePageTurning(false);
      setMobileTransitionDirection(null);
      setMobileTransitionMode(null);
    }, PAGE_TURN_DURATION_MS);
  };

  const handleMobileShowPhoto = () => {
    if (mobileNotebookPage !== 'comments' || isMobilePageTurning) return;

    carriedCommentText.current = commentText;
    cachedCommentsRef.current = liveComments;
    cachedCommentCountRef.current = liveCommentCount;
    mobileCarriedCommentText.current = commentText;
    mobileCachedCommentsRef.current = liveComments;
    mobileCachedCommentCountRef.current = liveCommentCount;

    setMobileTransitionDirection('prev');
    setMobileTransitionMode('page');
    setIsMobilePageTurning(true);

    setTimeout(() => {
      setMobileNotebookPage('photo');
      setIsMobilePageTurning(false);
      setMobileTransitionDirection(null);
      setMobileTransitionMode(null);
    }, PAGE_TURN_DURATION_MS);
  };

  const handleMobileLeftChevron = () => {
    if (mobileNotebookPage === 'comments') {
      handleMobileShowPhoto();
      return;
    }

    if (
      !hasPrevious ||
      isMobilePageTurning ||
      !onPrevious ||
      !previousMemory ||
      !previousDateInfo
    ) {
      return;
    }

    carriedCommentText.current = commentText;
    cachedCommentsRef.current = liveComments;
    cachedCommentCountRef.current = liveCommentCount;
    mobileCarriedCommentText.current = commentText;
    mobileCachedCommentsRef.current = liveComments;
    mobileCachedCommentCountRef.current = liveCommentCount;
    setMobileTransitionMemory(memory);
    setMobileTransitionDirection('prev');
    setMobileTransitionMode('memory');
    setIsMobilePageTurning(true);

    setTimeout(() => {
      setCommentText('');
      onPrevious();
      setMobileNotebookPage('photo');
      setIsMobilePageTurning(false);
      setMobileTransitionDirection(null);
      setMobileTransitionMode(null);
      setMobileTransitionMemory(null);
    }, PAGE_TURN_DURATION_MS);
  };

  const handleMobileRightChevron = () => {
    if (mobileNotebookPage === 'photo') {
      handleMobileShowComments();
      return;
    }

    if (!hasNext || isMobilePageTurning || !onNext || !nextMemory) return;

    carriedCommentText.current = commentText;
    cachedCommentsRef.current = liveComments;
    cachedCommentCountRef.current = liveCommentCount;
    mobileCarriedCommentText.current = commentText;
    mobileCachedCommentsRef.current = liveComments;
    mobileCachedCommentCountRef.current = liveCommentCount;
    setMobileTransitionMemory(memory);
    setMobileTransitionDirection('next');
    setMobileTransitionMode('memory');
    setIsMobilePageTurning(true);

    setTimeout(() => {
      setCommentText('');
      onNext();
      setMobileNotebookPage('photo');
      setIsMobilePageTurning(false);
      setMobileTransitionDirection(null);
      setMobileTransitionMode(null);
      setMobileTransitionMemory(null);
    }, PAGE_TURN_DURATION_MS);
  };

  // Resolve visibility display for a memory (icon + label, with group name for GROUP_ONLY)
  const getVisibilityDisplay = (
    vis: MemoryVisibility,
    pgId?: string | null
  ) => {
    const meta = VISIBILITY_META[vis] ?? VISIBILITY_META.PUBLIC;
    if (vis === 'GROUP_ONLY' && pgId) {
      const group = userGroups?.find((g) => g.id === pgId);
      return {
        Icon: meta.Icon,
        label: group ? `Private · ${group.name}` : 'Private',
      };
    }
    return meta;
  };

  function handleCommentSubmit(content: string) {
    createComment.mutate({ memoryId: memory!.id, content });
    setCommentText('');
  }

  function handleCommentDelete(commentId: string) {
    deleteComment.mutate({ commentId, memoryId: memory!.id });
  }

  const showCovers = animationPhase !== 'open';

  const baseLeftMemory = (
    isFlipping && flipDirection === 'next' ? cachedMemory : memory
  )!;
  const baseRightMemory = (
    isFlipping && flipDirection === 'prev' ? cachedMemory : memory
  )!;

  const mobileBookStageHeight =
    BOOK_HEIGHT * mobileBookScale + MOBILE_BOOK_TOP_OFFSET * mobileBookScale;
  const mobileVisibleBookWidth = MOBILE_VISIBLE_BOOK_WIDTH * mobileBookScale;
  const mobileBookOffsetX =
    mobileBookStageWidth / 2 -
    (BOOK_INNER_PADDING + PAGE_WIDTH / 2) * mobileBookScale;
  const mobileLeftChevronDisabled =
    isMobilePageTurning ||
    (mobileNotebookPage === 'photo' ? !hasPrevious : false);
  const mobileRightChevronDisabled =
    isMobilePageTurning ||
    (mobileNotebookPage === 'comments' ? !hasNext : false);
  const mobileLeftChevronLabel =
    mobileNotebookPage === 'comments' ? 'Show photo page' : 'Previous memory';
  const mobileRightChevronLabel =
    mobileNotebookPage === 'photo' ? 'Show comments page' : 'Next memory';
  const mobileRightShowsComments = mobileNotebookPage === 'photo';
  const mobileVisibleMemory = mobileTransitionMemory ?? memory;
  const isMobileNextMemoryTransition =
    mobileTransitionMode === 'memory' && mobileTransitionDirection === 'next';
  const isMobilePrevMemoryTransition =
    mobileTransitionMode === 'memory' && mobileTransitionDirection === 'prev';
  const shouldShowMobileCommentsPage =
    mobileNotebookPage === 'comments' &&
    !(
      isMobilePageTurning &&
      mobileTransitionDirection === 'prev' &&
      mobileTransitionMode === 'page'
    );

  const renderMemoryMenu = (
    pageMemory: MemoryWithCoordinates,
    triggerClassName = 'text-muted-foreground hover:text-foreground'
  ) => {
    const isPageOwner = !!(
      authUser &&
      pageMemory.creatorId &&
      pageMemory.creatorId === authUser.id
    );

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className={triggerClassName} aria-label="More options">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={6}
          className="min-w-[9.5rem] rounded-none border-2 border-[#2d2d2d] bg-[#fff4fb] p-0.5 shadow-none"
        >
          {isPageOwner && (
            <DropdownMenuItem
              className="min-h-8 rounded-none border border-transparent px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-black focus:border-[#2d2d2d] focus:bg-[#fd91e6] focus:text-black"
              onClick={() => setEditModalOpen(true)}
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit Memory
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="min-h-8 rounded-none border border-transparent px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-black focus:border-[#2d2d2d] focus:bg-[#ffd36b] focus:text-black"
            onClick={() => setReportModalOpen(true)}
          >
            <Flag className="mr-1.5 h-3.5 w-3.5" />
            Report Memory
          </DropdownMenuItem>
          {isPageOwner && (
            <DropdownMenuItem
              className="min-h-8 rounded-none border border-transparent px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-black focus:border-[#2d2d2d] focus:bg-[#ff9f9f] focus:text-black"
              onClick={() => setDeleteModalOpen(true)}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete Memory
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const renderAuthorHeader = (pageMemory: MemoryWithCoordinates) => {
    const pageAuthorName = pageMemory.creator
      ? `${pageMemory.creator.firstName} ${pageMemory.creator.lastName}`
      : 'Unknown Author';
    const pageAuthorPhoto = pageMemory.creator?.avatarUrl ?? null;

    return (
      <div className="flex items-start gap-3.5">
        <Avatar className="h-11 w-11 bg-white">
          {pageAuthorPhoto && (
            <AvatarImage
              src={pageAuthorPhoto}
              alt={pageAuthorName}
              className="bg-white object-contain"
            />
          )}
          <AvatarFallback className="bg-secondary text-sm text-black">
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-1 flex-col gap-0.5">
          <p className="text-normal text-black">{pageAuthorName}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {(() => {
              const visibilityDisplay = getVisibilityDisplay(
                pageMemory.visibility,
                pageMemory.privateGroupId
              );
              return (
                <>
                  <visibilityDisplay.Icon className="h-3 w-3 shrink-0" />
                  <span>{visibilityDisplay.label}</span>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    );
  };

  const renderPhotoPageContent = ({
    pageMemory,
    showSpineScale = false,
    pageSide = 'left',
  }: {
    pageMemory: MemoryWithCoordinates;
    showSpineScale?: boolean;
    pageSide?: 'left' | 'right';
  }) => {
    const mediaURLs = getMemoryMediaURLs(pageMemory);
    const mediaCount = mediaURLs.length;
    const activeImageIndex = getActiveImageIndex(pageMemory);
    const hasMultipleImages = mediaCount > 1;

    return (
      <>
        <div className="flex flex-1 items-center justify-center">
          <PolaroidMediaCarousel
            memory={pageMemory}
            activeIndex={activeImageIndex}
            onIndexChange={(nextIndex) =>
              handleImageIndexChange(pageMemory.id, nextIndex)
            }
          />
        </div>

        {mediaCount > 0 && (
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() =>
                handleImageIndexChange(pageMemory.id, activeImageIndex - 1)
              }
              disabled={!hasMultipleImages}
              className="inline-flex h-8 w-8 items-center justify-center border-2 border-black bg-white text-black transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="text-sm font-medium uppercase tracking-[0.12em] text-black">
              {activeImageIndex + 1} of {mediaCount}
            </div>

            <button
              type="button"
              onClick={() =>
                handleImageIndexChange(pageMemory.id, activeImageIndex + 1)
              }
              disabled={!hasMultipleImages}
              className="inline-flex h-8 w-8 items-center justify-center border-2 border-black bg-white text-black transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {pageSide === 'left' ? (
          <LeftPageSpineRings shouldScale={showSpineScale} />
        ) : (
          <RightPageSpineRings shouldScale={showSpineScale} />
        )}
      </>
    );
  };

  const renderDetailsPageContent = ({
    pageMemory,
    comments,
    totalComments,
    hasMore,
    isLoadingMore,
    isSubmitting,
    onSubmit,
    onDelete,
    onLoadMore,
    commentValue,
    onCommentValueChange,
    showSpineScale = false,
    pageSide = 'right',
    showCloseButton = false,
  }: {
    pageMemory: MemoryWithCoordinates;
    comments: typeof liveComments;
    totalComments: number;
    hasMore: boolean;
    isLoadingMore: boolean;
    isSubmitting: boolean;
    onSubmit: (content: string) => void;
    onDelete: (commentId: string) => void;
    onLoadMore: () => void;
    commentValue?: string;
    onCommentValueChange?: (text: string) => void;
    showSpineScale?: boolean;
    pageSide?: 'left' | 'right';
    showCloseButton?: boolean;
  }) => (
    <>
      {showCloseButton && (
        <div className="absolute right-10 top-7 z-20 flex items-center gap-1">
          {renderMemoryMenu(
            pageMemory,
            'inline-flex h-[34px] w-[34px] items-center justify-center border-2 bg-white text-black transition-colors hover:bg-[#fff4cc]'
          )}

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-[34px] w-[34px] items-center justify-center border-2 bg-white text-black transition-colors hover:bg-[#fff4cc]"
            style={{ borderColor: NOTEBOOK_BORDER_COLOR }}
            aria-label="Close memory details"
          >
            <X className="h-[14px] w-[14px]" />
          </button>
        </div>
      )}

      {renderAuthorHeader(pageMemory)}

      <div className="relative px-8 py-7">
        <div
          className="pointer-events-none absolute inset-[10px] border-2 border-black"
          aria-hidden="true"
        />
        <span
          className="pointer-events-none absolute left-[4px] top-[4px] h-4 w-4 border-2 border-black bg-white"
          aria-hidden="true"
        />
        <span
          className="pointer-events-none absolute right-[4px] top-[4px] h-4 w-4 border-2 border-black bg-white"
          aria-hidden="true"
        />
        <span
          className="pointer-events-none absolute bottom-[4px] left-[4px] h-4 w-4 border-2 border-black bg-white"
          aria-hidden="true"
        />
        <span
          className="pointer-events-none absolute bottom-[4px] right-[4px] h-4 w-4 border-2 border-black bg-white"
          aria-hidden="true"
        />
        <p className="relative z-10 text-center font-dancing text-2xl leading-relaxed text-black">
          {pageMemory.description || 'A memorable moment...'}
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-4">
        <ActionBar
          memory={pageMemory}
          onReport={() => setReportModalOpen(true)}
        />

        {pageMemory.tags && pageMemory.tags.length > 0 && (
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-black">
              Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {pageMemory.tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  style={{ borderRadius: 0 }}
                  className={
                    isAutoTag(tag.name)
                      ? 'border-black bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-black'
                      : 'border-black bg-[#f6cb48] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-black'
                  }
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <CommentSection
          comments={comments}
          commentCount={totalComments}
          currentUserId={user?.id}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          isSubmitting={isSubmitting}
          onSubmit={onSubmit}
          onDelete={onDelete}
          onLoadMore={onLoadMore}
          commentText={commentValue}
          onCommentTextChange={onCommentValueChange}
        />
      </div>

      {pageSide === 'left' ? (
        <LeftPageSpineRings shouldScale={showSpineScale} />
      ) : (
        <RightPageSpineRings shouldScale={showSpineScale} />
      )}
    </>
  );

  const renderMobilePeekPageContent = () => {
    if (mobileNotebookPage === 'comments' && nextMemory && nextDateInfo) {
      const nextMemoryMediaURL = getPrimaryMemoryMediaURL(nextMemory);

      return (
        <>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[1px_2px_3px_0px_rgba(0,0,0,0.12)]">
            <div className="relative aspect-[4/3] bg-slate-100">
              {nextMemoryMediaURL ? (
                <Image
                  src={nextMemoryMediaURL}
                  alt={nextMemory.title}
                  fill
                  sizes="320px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-sky-100 to-blue-50 px-6 text-center text-sm font-medium text-slate-500">
                  Next memory
                </div>
              )}
            </div>

            <div className="space-y-2 p-4 text-left">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-skolaroid-blue">
                Up Next
              </p>
              <p className="line-clamp-2 text-sm font-semibold text-foreground">
                {nextMemory.title || 'Untitled memory'}
              </p>
              <p className="text-xs text-muted-foreground">
                {nextDateInfo.month} {nextDateInfo.dayNumber}
              </p>
            </div>
          </div>

          <RightPageSpineRings />
        </>
      );
    }

    if (mobileNotebookPage === 'comments') {
      return (
        <>
          <div className="flex flex-1 flex-col justify-between rounded-xl border border-dashed border-slate-200 bg-white/70 p-5 text-center">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-skolaroid-blue">
                Last Memory
              </p>
              <p className="mt-3 text-sm font-medium text-foreground">
                You&apos;ve reached the end of this notebook.
              </p>
            </div>

            <div className="flex flex-1 items-center justify-center">
              <div className="rounded-full border border-slate-200 bg-card px-4 py-2 text-xs font-medium text-muted-foreground shadow-sm">
                No More Pages
              </div>
            </div>
          </div>

          <RightPageSpineRings />
        </>
      );
    }

    return (
      <>
        <div className="flex flex-1 flex-col justify-between rounded-xl border border-dashed border-slate-200 bg-white/70 p-5 text-center">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-skolaroid-blue">
              Next Page
            </p>
            <p className="mt-3 text-sm font-medium text-foreground">
              Comments, reactions, and tags wait on the next turn.
            </p>
          </div>

          <div className="flex flex-1 items-center justify-center">
            <div className="rounded-full border border-slate-200 bg-card px-4 py-2 text-xs font-medium text-muted-foreground shadow-sm">
              Flip To Continue
            </div>
          </div>
        </div>

        <RightPageSpineRings />
      </>
    );
  };

  const renderMobilePreviousMemoryDetailsPage = () => {
    if (!previousMemory) {
      return renderMobilePeekPageContent();
    }

    return renderDetailsPageContent({
      pageMemory: previousMemory,
      comments: [],
      totalComments: 0,
      hasMore: false,
      isLoadingMore: false,
      isSubmitting: false,
      onSubmit: () => {},
      onDelete: () => {},
      onLoadMore: () => {},
      commentValue: '',
      onCommentValueChange: () => {},
    });
  };

  const renderMobileStaticRightPageContent = () => {
    if (isMobilePrevMemoryTransition) {
      return renderMobilePreviousMemoryDetailsPage();
    }

    return renderMobilePeekPageContent();
  };

  const renderCoverLayers = () => {
    if (!showCovers) return null;

    return (
      <>
        <motion.div
          className="absolute left-0 top-0 h-full w-1/2 overflow-hidden"
          style={{
            transformOrigin: 'right center',
            transformStyle: 'preserve-3d',
          }}
          variants={coverLeftVariants}
          initial="closed"
          animate={animationPhase}
        >
          <div
            className="relative flex h-full items-center justify-center"
            style={{
              backgroundColor: NOTEBOOK_COVER_COLOR,
              backfaceVisibility: 'hidden',
            }}
          >
            <div className="relative flex flex-col items-center gap-2">
              <div className="h-24 w-1 rounded-full bg-[#8b6b12]/40" />
            </div>
            <div
              className="pointer-events-none absolute right-[-6px] top-0 flex h-full flex-col items-end justify-around py-[18px]"
              style={{ backfaceVisibility: 'hidden' }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-[8px] border-2"
                  style={{
                    width: `${NOTEBOOK_SPINE_RING_WIDTH}px`,
                    height: `${NOTEBOOK_SPINE_RING_HEIGHT}px`,
                    borderColor: NOTEBOOK_SPRING_BORDER_COLOR,
                    backgroundColor: NOTEBOOK_SPRING_COLOR,
                  }}
                />
              ))}
            </div>
          </div>
          <div
            className="absolute inset-0 bg-white"
            style={{
              transform: 'rotateY(180deg)',
              backfaceVisibility: 'hidden',
            }}
          />
        </motion.div>

        <motion.div
          className="absolute right-0 top-0 h-full w-1/2 overflow-hidden"
          style={{
            transformOrigin: 'left center',
            transformStyle: 'preserve-3d',
          }}
          variants={coverRightVariants}
          initial="closed"
          animate={animationPhase}
        >
          <div
            className="relative flex h-full items-center justify-center"
            style={{
              backgroundColor: NOTEBOOK_COVER_COLOR,
              backfaceVisibility: 'hidden',
            }}
          >
            <div className="relative flex flex-col items-center gap-2">
              <div className="h-24 w-1 rounded-full bg-[#8b6b12]/40" />
            </div>
            <div className="pointer-events-none absolute left-[-6px] top-0 flex h-full flex-col items-start justify-around py-[18px]">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-[8px] border-2"
                  style={{
                    width: `${NOTEBOOK_SPINE_RING_WIDTH}px`,
                    height: `${NOTEBOOK_SPINE_RING_HEIGHT}px`,
                    borderColor: NOTEBOOK_SPRING_BORDER_COLOR,
                    backgroundColor: NOTEBOOK_SPRING_COLOR,
                  }}
                />
              ))}
            </div>
          </div>
          <div
            className="absolute inset-0 bg-white"
            style={{
              transform: 'rotateY(180deg)',
              backfaceVisibility: 'hidden',
            }}
          />
        </motion.div>
      </>
    );
  };

  const renderDesktopBook = () => (
    <div className="flex items-center gap-6" style={{ perspective: '2000px' }}>
      <motion.button
        onClick={handlePrevious}
        disabled={!hasPrevious || isFlipping}
        className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-border bg-card text-black shadow-[3px_3px_0px_0px_#2d2d2d] transition-colors hover:shadow-[4px_4px_0px_0px_#2d2d2d] disabled:cursor-not-allowed disabled:opacity-30"
        variants={chevronVariants}
        initial="idle"
        whileHover={hasPrevious ? 'hover' : 'disabled'}
        whileTap={hasPrevious ? 'tap' : 'disabled'}
        aria-label="Previous memory"
      >
        <ChevronLeft className="h-6 w-6" />
      </motion.button>

      <div
        className="relative"
        style={{
          width: `${BOOK_WIDTH}px`,
          height: `${BOOK_HEIGHT}px`,
          overflow: 'visible',
          transformStyle: 'preserve-3d',
        }}
      >
        <div
          className="absolute inset-0 p-2"
          style={{
            border: `2px solid ${NOTEBOOK_BORDER_COLOR}`,
            backgroundColor: NOTEBOOK_COVER_COLOR,
            overflow: 'visible',
            transformStyle: 'preserve-3d',
          }}
        >
          <div
            className="relative z-10 flex h-full gap-2"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <NotebookSpineConnectors />

            <div
              className={`${PAGE_BASE_STYLES} relative`}
              style={{ width: `${PAGE_WIDTH}px`, zIndex: 1 }}
            >
              {renderPhotoPageContent({
                pageMemory: baseLeftMemory,
                showSpineScale: isFlipping && flipDirection === 'next',
              })}
            </div>

            <div
              className={`${PAGE_BASE_STYLES} relative`}
              style={{ width: `${PAGE_WIDTH}px`, zIndex: 1 }}
            >
              {renderDetailsPageContent({
                pageMemory: baseRightMemory,
                comments:
                  isFlipping && flipDirection === 'prev'
                    ? cachedCommentsRef.current
                    : liveComments,
                totalComments:
                  isFlipping && flipDirection === 'prev'
                    ? cachedCommentCountRef.current
                    : liveCommentCount,
                hasMore: isFlipping ? false : (hasNextPage ?? false),
                isLoadingMore: isFlipping ? false : isFetchingNextPage,
                isSubmitting: isFlipping ? false : createComment.isPending,
                onSubmit: isFlipping ? () => {} : handleCommentSubmit,
                onDelete: isFlipping ? () => {} : handleCommentDelete,
                onLoadMore: isFlipping ? () => {} : fetchNextPage,
                commentValue:
                  isFlipping && flipDirection === 'prev'
                    ? carriedCommentText.current
                    : commentText,
                onCommentValueChange: isFlipping ? () => {} : setCommentText,
                showSpineScale: isFlipping && flipDirection === 'prev',
                showCloseButton: true,
              })}
            </div>

            {cachedMemory && cachedDateInfo && flipDirection === 'prev' && (
              <motion.div
                className="absolute top-0"
                style={{
                  left: `${BOOK_INNER_PADDING}px`,
                  width: `${PAGE_WIDTH}px`,
                  height: '100%',
                  transformStyle: 'preserve-3d',
                  transformOrigin: `${PAGE_WIDTH}px 50%`,
                  willChange: 'transform',
                  zIndex: 20,
                }}
                variants={leftPageFlipVariants}
                initial="flat"
                animate={isLeftPageFlipped ? 'flipped' : 'flat'}
              >
                <div
                  className={PAGE_FACE_STYLES}
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  {renderPhotoPageContent({
                    pageMemory: cachedMemory,
                  })}
                </div>

                <div
                  className={PAGE_FACE_STYLES}
                  style={{
                    transform: 'rotateY(180deg)',
                    backfaceVisibility: 'hidden',
                  }}
                >
                  {renderDetailsPageContent({
                    pageMemory: memory,
                    comments: cachedCommentsRef.current,
                    totalComments: cachedCommentCountRef.current,
                    hasMore: false,
                    isLoadingMore: false,
                    isSubmitting: false,
                    onSubmit: () => {},
                    onDelete: () => {},
                    onLoadMore: () => {},
                    commentValue: '',
                    onCommentValueChange: () => {},
                  })}
                </div>
              </motion.div>
            )}

            {cachedMemory && flipDirection === 'next' && (
              <motion.div
                className="absolute top-0"
                style={{
                  right: `${BOOK_INNER_PADDING}px`,
                  width: `${PAGE_WIDTH}px`,
                  height: '100%',
                  transformStyle: 'preserve-3d',
                  transformOrigin: '0px 50%',
                  willChange: 'transform',
                  zIndex: 20,
                }}
                variants={rightPageFlipVariants}
                initial="flat"
                animate={isRightPageFlipped ? 'flipped' : 'flat'}
              >
                <div
                  className={PAGE_FACE_STYLES}
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  {renderDetailsPageContent({
                    pageMemory: cachedMemory,
                    comments: cachedCommentsRef.current,
                    totalComments: cachedCommentCountRef.current,
                    hasMore: false,
                    isLoadingMore: false,
                    isSubmitting: false,
                    onSubmit: () => {},
                    onDelete: () => {},
                    onLoadMore: () => {},
                    commentValue: carriedCommentText.current,
                    onCommentValueChange: () => {},
                  })}
                </div>

                <div
                  className={PAGE_FACE_STYLES}
                  style={{
                    transform: 'rotateY(180deg)',
                    backfaceVisibility: 'hidden',
                  }}
                >
                  {renderPhotoPageContent({
                    pageMemory: memory,
                  })}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {renderCoverLayers()}
      </div>

      <motion.button
        onClick={handleNext}
        disabled={!hasNext || isFlipping}
        className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-border bg-card text-black shadow-[3px_3px_0px_0px_#2d2d2d] transition-colors hover:shadow-[4px_4px_0px_0px_#2d2d2d] disabled:cursor-not-allowed disabled:opacity-30"
        variants={chevronVariants}
        initial="idle"
        whileHover={hasNext ? 'hover' : 'disabled'}
        whileTap={hasNext ? 'tap' : 'disabled'}
        aria-label="Next memory"
      >
        <ChevronRight className="h-6 w-6" />
      </motion.button>
    </div>
  );

  const renderMobileBook = () => (
    <div className="flex w-full max-w-[32rem] flex-col items-center gap-4 overflow-visible">
      <div className="flex w-full justify-end">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="inline-flex h-[42px] w-[42px] items-center justify-center border-2 bg-white text-black transition-colors hover:bg-[#fff4cc] active:translate-x-[2px] active:translate-y-[2px]"
          style={{ borderColor: NOTEBOOK_BORDER_COLOR }}
          aria-label="Close memory details"
        >
          <X className="h-[18px] w-[18px]" />
        </button>
      </div>

      <div
        className="relative overflow-visible"
        style={{
          width: mobileBookStageWidth,
          height: mobileBookStageHeight,
          perspective: '2000px',
        }}
      >
        <div
          className="absolute left-0 top-0"
          style={{
            width: `${BOOK_WIDTH}px`,
            height: `${BOOK_HEIGHT}px`,
            transform: `translate3d(${mobileBookOffsetX}px, ${MOBILE_BOOK_TOP_OFFSET * mobileBookScale}px, 0) scale(${mobileBookScale})`,
            transformOrigin: 'top left',
            transformStyle: 'preserve-3d',
          }}
        >
          <div
            className="absolute inset-0 p-2"
            style={{
              border: `2px solid ${NOTEBOOK_BORDER_COLOR}`,
              backgroundColor: NOTEBOOK_COVER_COLOR,
              overflow: 'visible',
              transformStyle: 'preserve-3d',
            }}
          >
            <div
              className="relative z-10 flex h-full gap-2"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <NotebookSpineConnectors />

              <div
                className={`${PAGE_BASE_STYLES} relative`}
                style={{ width: `${PAGE_WIDTH}px`, zIndex: 1 }}
              >
                {shouldShowMobileCommentsPage || isMobileNextMemoryTransition
                  ? renderDetailsPageContent({
                      pageMemory: mobileVisibleMemory,
                      comments: isMobileNextMemoryTransition
                        ? mobileCachedCommentsRef.current
                        : liveComments,
                      totalComments: isMobileNextMemoryTransition
                        ? mobileCachedCommentCountRef.current
                        : liveCommentCount,
                      hasMore: isMobileNextMemoryTransition
                        ? false
                        : (hasNextPage ?? false),
                      isLoadingMore: isMobileNextMemoryTransition
                        ? false
                        : isFetchingNextPage,
                      isSubmitting: isMobileNextMemoryTransition
                        ? false
                        : createComment.isPending,
                      onSubmit: isMobileNextMemoryTransition
                        ? () => {}
                        : handleCommentSubmit,
                      onDelete: isMobileNextMemoryTransition
                        ? () => {}
                        : handleCommentDelete,
                      onLoadMore: isMobileNextMemoryTransition
                        ? () => {}
                        : fetchNextPage,
                      commentValue: isMobileNextMemoryTransition
                        ? mobileCarriedCommentText.current
                        : commentText,
                      onCommentValueChange: isMobileNextMemoryTransition
                        ? () => {}
                        : setCommentText,
                      pageSide: 'left',
                    })
                  : renderPhotoPageContent({
                      pageMemory:
                        isMobilePrevMemoryTransition && previousMemory
                          ? previousMemory
                          : memory,
                    })}
              </div>

              <div
                className={`${PAGE_BASE_STYLES} relative`}
                style={{ width: `${PAGE_WIDTH}px`, zIndex: 1 }}
              >
                {renderMobileStaticRightPageContent()}
              </div>

              {isMobilePageTurning && mobileTransitionDirection === 'prev' && (
                <motion.div
                  className="absolute top-0"
                  style={{
                    left: `${BOOK_INNER_PADDING}px`,
                    width: `${PAGE_WIDTH}px`,
                    height: '100%',
                    transformStyle: 'preserve-3d',
                    transformOrigin: `${PAGE_WIDTH}px 50%`,
                    willChange: 'transform',
                    zIndex: 20,
                  }}
                  variants={leftPageFlipVariants}
                  initial="flat"
                  animate="flipped"
                >
                  <div
                    className={PAGE_FACE_STYLES}
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    {isMobilePrevMemoryTransition
                      ? renderPhotoPageContent({
                          pageMemory: mobileTransitionMemory ?? memory,
                        })
                      : renderDetailsPageContent({
                          pageMemory: memory,
                          comments: mobileCachedCommentsRef.current,
                          totalComments: mobileCachedCommentCountRef.current,
                          hasMore: false,
                          isLoadingMore: false,
                          isSubmitting: false,
                          onSubmit: () => {},
                          onDelete: () => {},
                          onLoadMore: () => {},
                          commentValue: mobileCarriedCommentText.current,
                          onCommentValueChange: () => {},
                          pageSide: 'left',
                        })}
                  </div>

                  <div
                    className={PAGE_FACE_STYLES}
                    style={{
                      transform: 'rotateY(180deg)',
                      backfaceVisibility: 'hidden',
                    }}
                  >
                    {isMobilePrevMemoryTransition
                      ? renderMobilePreviousMemoryDetailsPage()
                      : renderPhotoPageContent({
                          pageMemory: memory,
                          pageSide: 'right',
                        })}
                  </div>
                </motion.div>
              )}

              {isMobilePageTurning && mobileTransitionDirection === 'next' && (
                <motion.div
                  className="absolute top-0"
                  style={{
                    right: `${BOOK_INNER_PADDING}px`,
                    width: `${PAGE_WIDTH}px`,
                    height: '100%',
                    transformStyle: 'preserve-3d',
                    transformOrigin: '0px 50%',
                    willChange: 'transform',
                    zIndex: 20,
                  }}
                  variants={rightPageFlipVariants}
                  initial="flat"
                  animate="flipped"
                >
                  <div
                    className={PAGE_FACE_STYLES}
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    {renderMobilePeekPageContent()}
                  </div>

                  <div
                    className={PAGE_FACE_STYLES}
                    style={{
                      transform: 'rotateY(180deg)',
                      backfaceVisibility: 'hidden',
                    }}
                  >
                    {mobileTransitionMode === 'memory' &&
                    nextMemory &&
                    nextDateInfo
                      ? renderPhotoPageContent({
                          pageMemory: nextMemory,
                        })
                      : renderDetailsPageContent({
                          pageMemory: memory,
                          comments: mobileCachedCommentsRef.current,
                          totalComments: mobileCachedCommentCountRef.current,
                          hasMore: false,
                          isLoadingMore: false,
                          isSubmitting: false,
                          onSubmit: () => {},
                          onDelete: () => {},
                          onLoadMore: () => {},
                          commentValue: '',
                          onCommentValueChange: () => {},
                          pageSide: 'left',
                        })}
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {renderCoverLayers()}
        </div>
      </div>

      <div
        className="flex items-center justify-between"
        style={{ width: mobileVisibleBookWidth }}
      >
        <button
          type="button"
          onClick={handleMobileLeftChevron}
          disabled={mobileLeftChevronDisabled}
          className="z-30 flex h-10 w-10 items-center justify-center rounded-full border-2 border-border bg-card text-black shadow-[3px_3px_0px_0px_#2d2d2d] transition-colors hover:shadow-[4px_4px_0px_0px_#2d2d2d] disabled:cursor-not-allowed disabled:opacity-30"
          aria-label={mobileLeftChevronLabel}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={handleMobileRightChevron}
          disabled={mobileRightChevronDisabled}
          className="z-30 flex h-10 w-10 items-center justify-center rounded-full border-2 border-border bg-card text-black shadow-[3px_3px_0px_0px_#2d2d2d] transition-colors hover:shadow-[4px_4px_0px_0px_#2d2d2d] disabled:cursor-not-allowed disabled:opacity-30"
          aria-label={mobileRightChevronLabel}
        >
          {mobileRightShowsComments ? (
            <MessageSquare className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <AnimatePresence>
          {open && (
            <DialogPrimitive.Portal forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-[#2d2d2d]/50"
                variants={overlayVariants}
                initial="closed"
                animate="open"
                exit="closed"
                onClick={() => onOpenChange(false)}
              />

              <DialogPrimitive.Content asChild forceMount>
                <div
                  className={`fixed inset-0 z-50 flex ${
                    isMobileViewport
                      ? 'items-start justify-center px-3 pb-6 pt-20'
                      : 'items-center justify-center'
                  }`}
                >
                  <DialogTitle className="sr-only">{memory.title}</DialogTitle>
                  {isMobileViewport ? renderMobileBook() : renderDesktopBook()}
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

      {memory && (
        <EditMemoryModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          memory={memory}
        />
      )}
    </>
  );
}
