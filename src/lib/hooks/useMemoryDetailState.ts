import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
} from 'react';
import type { MemoryWithCoordinates } from './useAllMemoriesWithCoordinates';
import type { Comment } from '@/services/get-comments-service';
import { getMemoryMediaURLs } from '@/lib/memory-media';

export const MOBILE_BREAKPOINT = 768;
export const MOBILE_VISIBLE_BOOK_WIDTH = 520;
export const MOBILE_BOOK_TOP_OFFSET = 24;
export const MOBILE_LAYOUT_WIDTH_GUTTER = 24;
export const MOBILE_LAYOUT_HEIGHT_GUTTER = 220;
export const MOBILE_MIN_STAGE_WIDTH = 280;
export const PAGE_TURN_DURATION_MS = 610;
export const BOOK_HEIGHT = 650;

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

export function useMemoryDetailState(
  memory: MemoryWithCoordinates | null,
  open: boolean,
  initialImageIndex: number = 0
) {
  // Animation & visibility state
  const [animationPhase, setAnimationPhase] =
    useState<AnimationPhase>('closed');
  const [isRightPageFlipped, setIsRightPageFlipped] = useState(false);
  const [isLeftPageFlipped, setIsLeftPageFlipped] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<FlipDirection>(null);
  const [cachedMemory, setCachedMemory] =
    useState<MemoryWithCoordinates | null>(null);

  // Image carousel state
  const [activeImageIndexByMemoryId, setActiveImageIndexByMemoryId] = useState<
    Record<string, number>
  >({});

  // Mobile-specific state
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

  // Caption state
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [isCaptionTruncated, setIsCaptionTruncated] = useState(false);
  const [captionElement, setCaptionElement] =
    useState<HTMLParagraphElement | null>(null);
  const handleCaptionRef = useCallback((node: HTMLParagraphElement | null) => {
    setCaptionElement(node);
  }, []);

  // Comments state
  const [commentText, setCommentText] = useState('');
  const [isCommentsCollapsed, setIsCommentsCollapsed] = useState(false);

  // Refs for persisting state during page flips
  const carriedCommentText = useRef('');
  const cachedCommentsRef = useRef<Comment[]>([]);
  const cachedCommentCountRef = useRef(0);
  const mobileCachedCommentsRef = useRef<Comment[]>([]);
  const mobileCachedCommentCountRef = useRef(0);
  const mobileCarriedCommentText = useRef('');

  // Get active image index for a memory
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

  // Update image index
  const handleImageIndexChange = useCallback(
    (memoryId: string, nextIndex: number) => {
      setActiveImageIndexByMemoryId((prev) => {
        if (prev[memoryId] === nextIndex) return prev;
        return { ...prev, [memoryId]: nextIndex };
      });
    },
    []
  );

  // Get date info for display
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

  // Initialize image index when memory changes
  useEffect(() => {
    if (!memory || !open) return;
    setActiveImageIndexByMemoryId((prev) => {
      if (prev[memory.id] === initialImageIndex) return prev;
      return { ...prev, [memory.id]: initialImageIndex };
    });
  }, [initialImageIndex, memory, open]);

  // Manage animation phase on open/close
  useEffect(() => {
    if (open) {
      setAnimationPhase('opening');
      const timer = setTimeout(() => {
        setAnimationPhase('open');
      }, 0.3 * 1000); // BOOK_OPEN_DURATION
      return () => clearTimeout(timer);
    }
    setAnimationPhase('closing');
    const timer = setTimeout(() => {
      setAnimationPhase('closed');
    }, 0.5 * 1000); // BOOK_CLOSE_DURATION
    return () => clearTimeout(timer);
  }, [open]);

  // Reset state when modal closes
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
      setIsCaptionExpanded(false);
      setIsCommentsCollapsed(false);
    }
  }, [open]);

  // Reset UI state when memory changes
  useEffect(() => {
    setMobileNotebookPage('photo');
    setIsMobilePageTurning(false);
    setMobileTransitionDirection(null);
    setMobileTransitionMode(null);
    setMobileTransitionMemory(null);
    setCommentText('');
    setIsCaptionExpanded(false);
    setIsCommentsCollapsed(false);
  }, [memory?.id]);

  // Handle mobile viewport detection and scaling
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
        availableHeight / 650 // BOOK_HEIGHT
      );

      setMobileBookStageWidth(availableWidth);
      setMobileBookScale(scale);
    };

    updateMobileLayout();
    window.addEventListener('resize', updateMobileLayout);
    return () => window.removeEventListener('resize', updateMobileLayout);
  }, []);

  // Handle caption truncation detection
  useLayoutEffect(() => {
    if (!open) return;

    const element = captionElement;
    if (!element) return;

    let rafId = 0;

    const checkTruncation = () => {
      const currentElement = captionElement;
      if (!currentElement) return;
      setIsCaptionTruncated(
        currentElement.scrollHeight > currentElement.clientHeight
      );
    };

    const scheduleCheck = () => {
      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(checkTruncation);
    };

    scheduleCheck();

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(scheduleCheck)
        : null;
    resizeObserver?.observe(element);

    const fonts = document.fonts;
    fonts?.ready.then(scheduleCheck).catch(() => {});

    window.addEventListener('resize', scheduleCheck);

    return () => {
      window.cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', scheduleCheck);
    };
  }, [captionElement, memory?.description, memory?.id, open]);

  return {
    // Animation & page flip
    animationPhase,
    setAnimationPhase,
    isRightPageFlipped,
    setIsRightPageFlipped,
    isLeftPageFlipped,
    setIsLeftPageFlipped,
    isFlipping,
    setIsFlipping,
    flipDirection,
    setFlipDirection,
    cachedMemory,
    setCachedMemory,

    // Image carousel
    activeImageIndexByMemoryId,
    setActiveImageIndexByMemoryId,
    getActiveImageIndex,
    handleImageIndexChange,

    // Mobile state
    isMobileViewport,
    mobileBookScale,
    mobileBookStageWidth,
    mobileNotebookPage,
    setMobileNotebookPage,
    isMobilePageTurning,
    setIsMobilePageTurning,
    mobileTransitionDirection,
    setMobileTransitionDirection,
    mobileTransitionMode,
    setMobileTransitionMode,
    mobileTransitionMemory,
    setMobileTransitionMemory,

    // Caption
    isCaptionExpanded,
    setIsCaptionExpanded,
    isCaptionTruncated,
    handleCaptionRef,
    captionElement,

    // Comments
    commentText,
    setCommentText,
    isCommentsCollapsed,
    setIsCommentsCollapsed,

    // Refs for persisting state
    carriedCommentText,
    cachedCommentsRef,
    cachedCommentCountRef,
    mobileCachedCommentsRef,
    mobileCachedCommentCountRef,
    mobileCarriedCommentText,

    // Utilities
    getDateInfo,
  };
}
