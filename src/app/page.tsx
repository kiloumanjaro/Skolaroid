'use client';

import {
  Suspense,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, ShieldAlert, X } from 'lucide-react';
import { BatchSidebar, type Era } from '@/components/home/BatchSidebar';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog';
import { LoginForm } from '@/components/shared/auth/LoginForm';
import { useUserAuth } from '@/lib/hooks/useUserAuth';
import { AccountMenu } from '@/components/home/AccountMenu';
import { SpeechBubble } from '@/components/shared/display/SpeechBubble';
import { Button } from '@/components/ui/Button';

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 1000;
const INITIAL_CANVAS_OFFSET_X = -(CANVAS_WIDTH / 2);
const INITIAL_CANVAS_OFFSET_Y = -(CANVAS_HEIGHT / 2);
const HERO_TEXT_X = 0;
const HERO_TEXT_Y = -30;
const EXPLORE_BUTTON_X = 0;
const EXPLORE_BUTTON_Y = 105;
const BATCH_CARD_SIZE = 64;
const DRAG_PADDING = 120;
const BATCH_TOOLTIP_WIDTH = 250;

const BATCH_CANVAS_ITEMS = [
  // Center-based world coordinates. Keep batch positions between -1000 and 1000.
  {
    year: 2026,
    label: 'Batch 26',
    message: 'First day jitters and new campus maps everywhere.',
    x: -330,
    y: 250,
  },
  {
    year: 2025,
    label: 'Batch 25',
    message:
      'Still making the most of every org fair and late-night study session.',
    x: 490,
    y: 220,
  },
  {
    year: 2024,
    label: 'Batch 24',
    message: 'One more year of core memories, class photos, and reunions.',
    x: 554,
    y: -14,
  },
  {
    year: 2023,
    label: 'Batch 23',
    message: 'Fresh graduation energy and a lot of stories worth keeping.',
    x: 490,
    y: -192,
  },
  {
    year: 2022,
    label: 'Batch 22',
    message:
      'Back on campus and finally turning online friendships into real ones.',
    x: -530,
    y: 60,
  },
  {
    year: 2021,
    label: 'Batch 21',
    message: 'Zoom screens, chat boxes, and resilience through every semester.',
    x: -240,
    y: -180,
  },
  {
    year: 2020,
    label: 'Batch 20',
    message: 'The batch that learned to celebrate milestones from anywhere.',
    x: -560,
    y: -250,
  },
  {
    year: 2019,
    label: 'Batch 19',
    message:
      'Last full year before everything changed, full of packed hallways and events.',
    x: -750,
    y: -520,
  },
  {
    year: 2018,
    label: 'Batch 18',
    message:
      'Class projects, field trips, and a camera roll full of candid moments.',
    x: -600,
    y: -760,
  },
  {
    year: 2017,
    label: 'Batch 17',
    message:
      'A lively batch known for campus traditions and nonstop group photos.',
    x: -1000,
    y: -320,
  },
  {
    year: 2016,
    label: 'Batch 16',
    message: 'Study circles, org booths, and memorable after-class hangouts.',
    x: -960,
    y: 20,
  },
  {
    year: 2015,
    label: 'Batch 15',
    message:
      'A scrapbook year of recitals, recognition days, and barkada energy.',
    x: -1000,
    y: 300,
  },
  {
    year: 2014,
    label: 'Batch 14',
    message:
      'Busy corridors, handwritten reviewers, and plenty of victory photos.',
    x: -1000,
    y: 680,
  },
  {
    year: 2013,
    label: 'Batch 13',
    message:
      'A batch remembered for campus events and strong community spirit.',
    x: -920,
    y: 960,
  },
  {
    year: 2012,
    label: 'Batch 12',
    message:
      'Long lectures, photo booths, and friendships that lasted well beyond class.',
    x: -620,
    y: 760,
  },
  {
    year: 2011,
    label: 'Batch 11',
    message:
      'An era of notebooks, printed handouts, and classic college moments.',
    x: -300,
    y: 1000,
  },
  {
    year: 2010,
    label: 'Batch 10',
    message:
      'A milestone batch with polished uniforms and early social media memories.',
    x: 40,
    y: 780,
  },
  {
    year: 2009,
    label: 'Batch 09',
    message: 'Campus life felt analog, noisy, and wonderfully unforgettable.',
    x: 360,
    y: 1000,
  },
  {
    year: 2008,
    label: 'Batch 08',
    message: 'Friends, fairs, and photos that now feel like time capsules.',
    x: 640,
    y: 600,
  },
  {
    year: 2007,
    label: 'Batch 07',
    message: 'A strong batch with school spirit woven into every event.',
    x: 1000,
    y: 760,
  },
  {
    year: 2006,
    label: 'Batch 06',
    message: 'Stacks of notes, canteen breaks, and familiar campus corners.',
    x: 1000,
    y: 420,
  },
  {
    year: 2005,
    label: 'Batch 05',
    message:
      'A batch shaped by routines, rituals, and a lot of shared milestones.',
    x: 1000,
    y: 20,
  },
  {
    year: 2004,
    label: 'Batch 04',
    message:
      'Old-school snapshots and stories that still get retold at reunions.',
    x: 700,
    y: -480,
  },
  {
    year: 2003,
    label: 'Batch 03',
    message:
      'An era of printed photos, handwritten dedications, and yearbook notes.',
    x: 920,
    y: -760,
  },
  {
    year: 2002,
    label: 'Batch 02',
    message:
      'Small moments, big milestones, and a campus world that felt close-knit.',
    x: 620,
    y: -1000,
  },
  {
    year: 2001,
    label: 'Batch 01',
    message:
      'A batch that stepped into the new millennium with plenty of hope and hustle.',
    x: 220,
    y: -920,
  },
  {
    year: 2000,
    label: 'Batch 00',
    message:
      'A turn-of-the-century class with memories that still feel iconic.',
    x: -180,
    y: -800,
  },
  {
    year: 1999,
    label: 'Batch 99',
    message: 'End-of-era energy with all the charm of late-90s campus life.',
    x: -560,
    y: -1000,
  },
  {
    year: 1998,
    label: 'Batch 98',
    message:
      'A nostalgic batch filled with classic group shots and close friendships.',
    x: -920,
    y: -1000,
  },
  {
    year: 1997,
    label: 'Batch 97',
    message:
      'The kind of batch people remember by faces, laughter, and old photo prints.',
    x: -1000,
    y: -820,
  },
  {
    year: 1996,
    label: 'Batch 96',
    message: 'Quiet moments, campus traditions, and memories stored in albums.',
    x: -280,
    y: -560,
  },
  {
    year: 1995,
    label: 'Batch 95',
    message:
      'A well-loved batch from an era of handwritten notes and film cameras.',
    x: 1000,
    y: 1000,
  },
  {
    year: 1994,
    label: 'Batch 94',
    message: 'A class full of stories that feel warmer every reunion season.',
    x: -240,
    y: 600,
  },
  {
    year: 1993,
    label: 'Batch 93',
    message:
      'An old-school batch carried by memory books, letters, and loyalty.',
    x: 120,
    y: 500,
  },
  {
    year: 1992,
    label: 'Batch 92',
    message:
      'Campus life looked different then, but the friendships were just as strong.',
    x: 10,
    y: -420,
  },
  {
    year: 1991,
    label: 'Batch 91',
    message:
      'A batch remembered through keepsakes, photos, and familiar names.',
    x: 1000,
    y: -280,
  },
  {
    year: 1990,
    label: 'Batch 90',
    message:
      'A foundational batch with memories that still anchor the alumni story.',
    x: 410,
    y: -620,
  },
] as const;

const ERAS: Era[] = [
  {
    decade: 2020,
    label: '2020s',
    color: 'bg-sky-100',
    imageUrl: '/assets/images/eras/2020.png',
  },
  {
    decade: 2010,
    label: '2010s',
    color: 'bg-slate-100',
    imageUrl: '/assets/images/eras/2010.png',
  },
  {
    decade: 2000,
    label: '2000s',
    color: 'bg-green-100',
    imageUrl: '/assets/images/eras/2000.png',
  },
  {
    decade: 1990,
    label: '1990s',
    color: 'bg-amber-100',
    imageUrl: '/assets/images/eras/1990.png',
  },
];

type CanvasOffset = {
  x: number;
  y: number;
};

type ViewportSize = {
  width: number;
  height: number;
};

type DragOrigin = {
  pointerX: number;
  pointerY: number;
  startOffsetX: number;
  startOffsetY: number;
};

type DragBounds = {
  minOffsetX: number;
  maxOffsetX: number;
  minOffsetY: number;
  maxOffsetY: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getDragBounds(viewportSize: ViewportSize): DragBounds {
  const halfCard = BATCH_CARD_SIZE / 2;
  const minBatchX =
    Math.min(...BATCH_CANVAS_ITEMS.map((batch) => batch.x)) - halfCard;
  const maxBatchX =
    Math.max(...BATCH_CANVAS_ITEMS.map((batch) => batch.x)) + halfCard;
  const minBatchY =
    Math.min(...BATCH_CANVAS_ITEMS.map((batch) => batch.y)) - halfCard;
  const maxBatchY =
    Math.max(...BATCH_CANVAS_ITEMS.map((batch) => batch.y)) + halfCard;
  const viewportHalfWidth = viewportSize.width / 2;
  const viewportHalfHeight = viewportSize.height / 2;
  const minWorldShiftX = DRAG_PADDING - viewportHalfWidth - minBatchX;
  const maxWorldShiftX = viewportHalfWidth - DRAG_PADDING - maxBatchX;
  const minWorldShiftY = DRAG_PADDING - viewportHalfHeight - minBatchY;
  const maxWorldShiftY = viewportHalfHeight - DRAG_PADDING - maxBatchY;

  return {
    minOffsetX: Math.min(minWorldShiftX, maxWorldShiftX) - CANVAS_WIDTH / 2,
    maxOffsetX: Math.max(minWorldShiftX, maxWorldShiftX) - CANVAS_WIDTH / 2,
    minOffsetY: Math.min(minWorldShiftY, maxWorldShiftY) - CANVAS_HEIGHT / 2,
    maxOffsetY: Math.max(minWorldShiftY, maxWorldShiftY) - CANVAS_HEIGHT / 2,
  };
}

function clampCanvasOffset(
  offset: CanvasOffset,
  viewportSize: ViewportSize
): CanvasOffset {
  const bounds = getDragBounds(viewportSize);

  return {
    x: clamp(offset.x, bounds.minOffsetX, bounds.maxOffsetX),
    y: clamp(offset.y, bounds.minOffsetY, bounds.maxOffsetY),
  };
}

function BatchCanvasCard({
  year,
  label,
  message,
  x,
  y,
}: (typeof BATCH_CANVAS_ITEMS)[number]) {
  const displayYear = year.toString().slice(-2);
  const [isHovered, setIsHovered] = useState(false);
  const era = Math.floor(year / 10) * 10;
  const href = `/map?era=${era}`;
  const isLeftEdge = x <= -1000;

  return (
    <div
      className={`absolute ${isHovered ? 'z-[120]' : 'z-0'}`}
      style={{
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <SpeechBubble
        width={BATCH_TOOLTIP_WIDTH}
        height={126}
        message={message}
        visible={isHovered}
        {...(isLeftEdge && { tailPosition: 'center' })}
        className={`pointer-events-none absolute bottom-full left-1/2 z-[100] mb-5 ${
          isLeftEdge ? '-translate-x-1/2' : '-translate-x-[80%]'
        }`}
      />
      <Link
        href={href}
        data-batch={year}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        onPointerDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
        className="group relative z-10 block cursor-pointer"
        aria-label={label}
        draggable={false}
      >
        <div className="relative flex h-16 w-16 items-center justify-center rounded-[5px] border-2 border-border bg-card shadow-[2px_2px_0px_0px_#2d2d2d] transition-transform duration-200 group-hover:-translate-y-1">
          <span className="text-3xl font-medium text-foreground">
            {displayYear}
          </span>
        </div>
      </Link>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const { isAuthenticated, loading } = useUserAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const drawerContentRef = useRef<HTMLDivElement>(null);
  const [isSidebarDragging, setIsSidebarDragging] = useState(false);
  const [sidebarStartY, setSidebarStartY] = useState(0);
  const [sidebarScrollTop, setSidebarScrollTop] = useState(0);
  const [canvasOffset, setCanvasOffset] = useState<CanvasOffset>({
    x: INITIAL_CANVAS_OFFSET_X,
    y: INITIAL_CANVAS_OFFSET_Y,
  });
  const [viewportSize, setViewportSize] = useState<ViewportSize>({
    width: 0,
    height: 0,
  });
  const canvasOffsetRef = useRef<CanvasOffset>({
    x: INITIAL_CANVAS_OFFSET_X,
    y: INITIAL_CANVAS_OFFSET_Y,
  });
  const dragOriginRef = useRef<DragOrigin | null>(null);
  const [isCanvasDragging, setIsCanvasDragging] = useState(false);

  // Show a fixed error banner if auth_error is present, then clean the URL.
  useEffect(() => {
    if (searchParams.get('auth_error')) {
      setAuthError(
        'Only @up.edu.ph Google accounts are allowed. Please sign in with your UP mail.'
      );

      // Clean both the query param and any leftover hash fragments.
      window.history.replaceState({}, '', window.location.pathname);

      const timer = setTimeout(() => setAuthError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      const pendingRedirect = sessionStorage.getItem('invite_redirect');
      if (pendingRedirect) {
        sessionStorage.removeItem('invite_redirect');
        router.push(pendingRedirect);
      }
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    const updateViewportSize = () => {
      const nextViewportSize = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      setViewportSize(nextViewportSize);

      const nextOffset = clampCanvasOffset(
        canvasOffsetRef.current,
        nextViewportSize
      );
      canvasOffsetRef.current = nextOffset;
      setCanvasOffset(nextOffset);
    };

    updateViewportSize();
    window.addEventListener('resize', updateViewportSize);

    return () => {
      window.removeEventListener('resize', updateViewportSize);
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isSidebarDragging || !drawerContentRef.current) return;
      event.preventDefault();
      const walk = (sidebarStartY - event.pageY) * 2;
      drawerContentRef.current.scrollTop = sidebarScrollTop + walk;
    };

    const handleMouseUp = () => {
      setIsSidebarDragging(false);
    };

    if (isSidebarDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isSidebarDragging, sidebarScrollTop, sidebarStartY]);

  useEffect(() => {
    if (!isCanvasDragging) return;

    const updateCanvasPosition = (clientX: number, clientY: number) => {
      const dragOrigin = dragOriginRef.current;
      if (!dragOrigin) return;

      const nextOffset = clampCanvasOffset(
        {
          x: dragOrigin.startOffsetX + (clientX - dragOrigin.pointerX),
          y: dragOrigin.startOffsetY + (clientY - dragOrigin.pointerY),
        },
        viewportSize
      );

      canvasOffsetRef.current = nextOffset;
      setCanvasOffset(nextOffset);
    };

    const stopCanvasDrag = () => {
      dragOriginRef.current = null;
      setIsCanvasDragging(false);
    };

    const handleMouseMove = (event: MouseEvent) => {
      event.preventDefault();
      updateCanvasPosition(event.clientX, event.clientY);
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 0) return;
      event.preventDefault();
      const touch = event.touches[0];
      updateCanvasPosition(touch.clientX, touch.clientY);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopCanvasDrag);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', stopCanvasDrag);
    document.addEventListener('touchcancel', stopCanvasDrag);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', stopCanvasDrag);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', stopCanvasDrag);
      document.removeEventListener('touchcancel', stopCanvasDrag);
    };
  }, [isCanvasDragging, viewportSize]);

  const handleSidebarMouseDown = (event: ReactMouseEvent) => {
    if (!drawerContentRef.current) return;
    setIsSidebarDragging(true);
    setSidebarStartY(event.pageY);
    setSidebarScrollTop(drawerContentRef.current.scrollTop);
  };

  const startCanvasDrag = (clientX: number, clientY: number) => {
    dragOriginRef.current = {
      pointerX: clientX,
      pointerY: clientY,
      startOffsetX: canvasOffsetRef.current.x,
      startOffsetY: canvasOffsetRef.current.y,
    };
    setIsCanvasDragging(true);
  };

  const handleCanvasMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    startCanvasDrag(event.clientX, event.clientY);
  };

  const handleCanvasTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    startCanvasDrag(touch.clientX, touch.clientY);
  };

  const openLoginModal = () => {
    setDrawerOpen(false);
    setLoginOpen(true);
  };

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden">
      {/* ── Auth error banner ── */}
      {authError && (
        <div
          className="fixed left-1/2 top-4 z-[200] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 animate-slide-down"
          role="alert"
          id="auth-error-banner"
        >
          <div className="flex items-start gap-3 rounded-xl border-2 border-red-300 bg-white px-4 py-3 shadow-[3px_3px_0px_0px_#2d2d2d]">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-700">
                Sign-in failed
              </p>
              <p className="mt-0.5 text-sm text-gray-700">{authError}</p>
            </div>
            <button
              type="button"
              onClick={() => setAuthError(null)}
              className="shrink-0 text-gray-400 transition-colors hover:text-gray-600"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      <div className="fixed right-5 top-3 z-50 flex items-center gap-3">
        {loading ? (
          <div className="flex h-8 w-8 animate-pulse items-center justify-center rounded-full border-2 border-foreground bg-card text-foreground">
            <User className="h-4 w-4" />
          </div>
        ) : isAuthenticated ? (
          <AccountMenu />
        ) : (
          <Button
            onClick={openLoginModal}
            size="sm"
            className="hover:bg-primary active:bg-primary"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            Sign in
          </Button>
        )}
      </div>

      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle className="sr-only">Login</DialogTitle>
          <LoginForm />
        </DialogContent>
      </Dialog>

      <BatchSidebar
        drawerOpen={drawerOpen}
        setDrawerOpen={setDrawerOpen}
        isDragging={isSidebarDragging}
        isAuthenticated={isAuthenticated}
        setLoginOpen={openLoginModal}
        eras={ERAS}
        onMouseDown={handleSidebarMouseDown}
        drawerContentRef={drawerContentRef}
      />

      {drawerOpen && (
        <div
          className="fixed inset-0 z-[130] bg-[#2d2d2d]/20 transition-opacity duration-300"
          onClick={() => setDrawerOpen(false)}
          aria-label="Close drawer overlay"
        />
      )}

      <div
        className="fixed inset-0 z-10 transition-all duration-300 ease-in-out"
        style={{
          marginLeft:
            drawerOpen && viewportSize.width > 0
              ? `${Math.min(viewportSize.width, 600)}px`
              : '0px',
        }}
      >
        <div
          className={`absolute inset-0 touch-none select-none overflow-hidden ${
            isCanvasDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          onMouseDown={handleCanvasMouseDown}
          onTouchStart={handleCanvasTouchStart}
        >
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              width: `${CANVAS_WIDTH}px`,
              height: `${CANVAS_HEIGHT}px`,
              transform: `translate3d(${canvasOffset.x}px, ${canvasOffset.y}px, 0)`,
            }}
          >
            {BATCH_CANVAS_ITEMS.map((batch) => (
              <BatchCanvasCard key={batch.year} {...batch} />
            ))}

            <div
              className="absolute px-4 text-center"
              style={{
                left: `calc(50% + ${HERO_TEXT_X}px)`,
                top: `calc(50% + ${HERO_TEXT_Y}px)`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <h1 className="whitespace-nowrap !text-4xl font-normal tracking-tight text-foreground md:!text-5xl lg:!text-5xl">
                turn your memories
                <br />
                into{' '}
                <span className="font-dancing !text-5xl text-skolaroid-blue md:!text-6xl">
                  Skolaroid
                </span>
              </h1>
            </div>

            <button
              type="button"
              onMouseDown={(event) => event.stopPropagation()}
              onTouchStart={(event) => event.stopPropagation()}
              onClick={() => setDrawerOpen(!drawerOpen)}
              className="group absolute h-16 w-40 cursor-pointer overflow-hidden border-2 border-border shadow-[4px_4px_0px_0px_#2d2d2d] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#2d2d2d] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
              style={{
                left: `calc(50% + ${EXPLORE_BUTTON_X}px)`,
                top: `calc(50% + ${EXPLORE_BUTTON_Y}px)`,
                transform: 'translate(-50%, -50%)',
              }}
              aria-label="Explore Skolaroid"
            >
              <div className="absolute left-0 top-0 h-16 w-40 bg-card transition-all group-hover:bg-skolaroid-blue group-active:bg-skolaroid-blue" />
              <div className="relative flex h-16 w-40 items-center justify-center text-center text-lg font-medium text-foreground transition-colors group-hover:text-white group-active:text-white">
                {drawerOpen ? 'Close' : 'Explore'}
              </div>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
