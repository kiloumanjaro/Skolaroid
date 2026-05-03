'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
} from 'react';
import { LoginForm } from '@/components/login-form';
import {
  MainShellChromeProvider,
  MainShellSidebarActionProvider,
  type MainShellSidebarAction,
} from '@/components/main-shell-sidebar-action';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { useUserAuth } from '@/lib/hooks/useUserAuth';
import { cn } from '@/lib/utils';

const shellRoutes = ['/map', '/gallery', '/admin', '/about'];

const navItems = [
  {
    href: '/gallery',
    label: 'Gallery',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <rect
          x="3.5"
          y="4.5"
          width="17"
          height="15"
          rx="2.5"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M7 15l3.25-3.25a1 1 0 0 1 1.414 0L15 15.086l1.25-1.25a1 1 0 0 1 1.414 0L20 16"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="9" cy="9" r="1.25" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: '/map',
    label: 'Map',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M9 4.5l6-2v17l-6 2-6-2v-17l6 2Zm0 0v17m6-19 6 2v17l-6-2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: '/admin',
    label: 'Admin',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M12 3.75 18.5 6.5v5.25c0 4.12-2.63 7.92-6.5 9-3.87-1.08-6.5-4.88-6.5-9V6.5L12 3.75Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9.75 12.25 11.25 13.75 14.5 10.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: '/about',
    label: 'About',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <circle
          cx="12"
          cy="12"
          r="8.5"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M12 10.25v5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="12" cy="7.75" r="1" fill="currentColor" />
      </svg>
    ),
  },
];

function isShellRoute(pathname: string) {
  return shellRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function SwipeLogoutAction({
  isOpen,
  onLogout,
  avatarUrl,
  avatarAlt,
}: {
  isOpen: boolean;
  onLogout: () => void;
  avatarUrl?: string | null;
  avatarAlt: string;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const offsetRef = useRef(0);
  const dragStartXRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);
  const handleSize = 48;
  const maxOffset = Math.max(trackWidth - handleSize, 0);
  const completionThreshold = Math.max(maxOffset - 20, maxOffset * 0.72);

  const resetSwipe = useCallback(() => {
    dragStartXRef.current = 0;
    dragStartOffsetRef.current = 0;
    offsetRef.current = 0;
    setDragging(false);
    setOffset(0);
  }, []);

  const updateOffset = useCallback(
    (nextOffset: number) => {
      const clampedOffset = Math.min(Math.max(nextOffset, 0), maxOffset);
      offsetRef.current = clampedOffset;
      setOffset(clampedOffset);
    },
    [maxOffset]
  );

  const finishDrag = useCallback(() => {
    setDragging(false);

    if (maxOffset > 0 && offsetRef.current >= completionThreshold) {
      setHasCompleted(true);
      updateOffset(maxOffset);
      onLogout();
      return;
    }

    resetSwipe();
  }, [completionThreshold, maxOffset, onLogout, resetSwipe, updateOffset]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    const updateWidth = () => {
      setTrackWidth(track.offsetWidth);
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(() => {
      updateWidth();
    });

    resizeObserver.observe(track);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetSwipe();
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setTrackWidth(trackRef.current?.offsetWidth ?? 0);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isOpen, resetSwipe]);

  useEffect(() => {
    if (!dragging) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const deltaX = event.clientX - dragStartXRef.current;
      updateOffset(dragStartOffsetRef.current + deltaX);
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) {
        return;
      }

      updateOffset(
        dragStartOffsetRef.current + (touch.clientX - dragStartXRef.current)
      );
    };

    const handleRelease = () => {
      finishDrag();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleRelease);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleRelease);
    window.addEventListener('touchcancel', handleRelease);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleRelease);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleRelease);
      window.removeEventListener('touchcancel', handleRelease);
    };
  }, [dragging, finishDrag, updateOffset]);

  const startDrag = (clientX: number) => {
    if (hasCompleted || maxOffset <= 0) {
      return;
    }

    dragStartXRef.current = clientX;
    dragStartOffsetRef.current = offsetRef.current;
    setDragging(true);
  };

  const handleMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    startDrag(event.clientX);
  };

  const handleTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    startDrag(touch.clientX);
  };

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  return (
    <div className="w-full">
      <div
        ref={trackRef}
        className="relative flex h-12 w-full items-center overflow-hidden border-2 border-black bg-white"
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-16 pr-4">
          <span
            className={cn(
              'overflow-hidden whitespace-nowrap text-sm font-semibold uppercase tracking-[0.18em] text-foreground transition-all duration-300 ease-in-out',
              isOpen ? 'max-w-[160px] opacity-100' : 'max-w-0 opacity-0'
            )}
          >
            {hasCompleted ? 'Logging out...' : 'Swipe to logout'}
          </span>
        </div>

        <div
          role="button"
          tabIndex={-1}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className={cn(
            'absolute left-0 top-0 flex h-12 w-12 touch-none select-none items-center justify-center overflow-hidden border-r-2 border-black bg-[#539fff] text-black transition-transform duration-200 ease-out',
            offset > 0 ? 'border-l-2' : 'border-l-0',
            dragging ? 'cursor-grabbing' : 'cursor-grab'
          )}
          style={{ transform: `translateX(${offset}px)` }}
          aria-label="Swipe to logout"
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={avatarAlt}
              width={48}
              height={48}
              draggable={false}
              className="pointer-events-none h-full w-full object-cover"
            />
          ) : (
            <span className="text-sm font-black uppercase tracking-[0.12em]">
              {avatarAlt.charAt(0)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ShellSidebar({
  isOpen,
  isAuthenticated,
  isAdmin,
  leadingAction,
  userAvatar,
  userName,
  onPrimaryAction,
  onLeadingAction,
  onNavigate,
}: {
  isOpen: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  leadingAction: MainShellSidebarAction | null;
  userAvatar?: string | null;
  userName: string;
  onPrimaryAction: () => void;
  onLeadingAction: (action: MainShellSidebarAction) => void;
  onNavigate: (href: string) => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isBatchesActionActive =
    leadingAction?.label === 'Batches' &&
    searchParams.get('openBatches') === '1';
  const visibleNavItems = isAdmin
    ? navItems
    : navItems.filter((item) => item.href !== '/admin');

  return (
    <aside
      className={`flex h-full flex-col overflow-hidden bg-[#fcfaf8] text-foreground transition-all duration-300 ease-in-out ${
        isOpen ? 'w-64' : 'w-0'
      }`}
    >
      <div className="px-4 pb-6 pt-6">
        <div
          className={`flex justify-center overflow-hidden transition-all duration-300 ease-in-out ${
            isOpen ? 'max-w-[220px] opacity-100' : 'max-w-0 opacity-0'
          }`}
        >
          <p className="whitespace-nowrap font-dancing text-4xl font-bold leading-none text-skolaroid-blue">
            Skolaroid
          </p>
        </div>
      </div>

      <nav className="flex flex-col gap-2 px-2">
        {leadingAction && (
          <button
            type="button"
            onClick={() => onLeadingAction(leadingAction)}
            className={cn(
              'group relative flex h-12 items-center gap-3 overflow-hidden px-3 transition-all duration-300 ease-in-out',
              isBatchesActionActive
                ? 'rounded-none border-2 border-black bg-white text-foreground'
                : 'rounded-none text-foreground/80 hover:bg-foreground/5 hover:text-foreground'
            )}
          >
            {isBatchesActionActive && (
              <div className="absolute inset-0 bg-white" />
            )}
            <span className="relative flex h-6 w-6 shrink-0 items-center justify-center">
              {leadingAction.icon}
            </span>
            <span
              className={`relative overflow-hidden whitespace-nowrap text-sm font-medium transition-all duration-300 ease-in-out ${
                isOpen ? 'max-w-[120px] opacity-100' : 'max-w-0 opacity-0'
              }`}
            >
              {leadingAction.label}
            </span>
          </button>
        )}

        {visibleNavItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(event) => {
                event.preventDefault();
                onNavigate(item.href);
              }}
              className={`group relative flex h-12 items-center gap-3 overflow-hidden px-3 transition-all duration-300 ease-in-out ${
                isActive
                  ? 'rounded-none border-2 border-black bg-white'
                  : 'rounded-none text-foreground/80 hover:bg-foreground/5 hover:text-foreground'
              }`}
            >
              {isActive && <div className="absolute inset-0 bg-white" />}
              <span
                className={`relative flex h-6 w-6 shrink-0 items-center justify-center ${
                  isActive ? 'text-foreground' : ''
                }`}
              >
                {item.icon}
              </span>
              <span
                className={`relative overflow-hidden whitespace-nowrap text-sm font-medium transition-all duration-300 ease-in-out ${
                  isOpen ? 'max-w-[120px] opacity-100' : 'max-w-0 opacity-0'
                } ${isActive ? 'text-foreground' : ''}`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-2 pb-3 pt-6">
        {isAuthenticated ? (
          <SwipeLogoutAction
            isOpen={isOpen}
            onLogout={onPrimaryAction}
            avatarUrl={userAvatar}
            avatarAlt={userName}
          />
        ) : (
          <button
            type="button"
            onClick={onPrimaryAction}
            className="flex h-12 w-full items-center gap-3 rounded-none px-3 text-foreground/80 transition-all duration-300 ease-in-out hover:bg-foreground/5 hover:text-foreground"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path
                  d="M9 5.75H6.75A1.75 1.75 0 0 0 5 7.5v9A1.75 1.75 0 0 0 6.75 18.25H9"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M13 8.5 18 12l-5 3.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M18 12H9"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span
              className={`overflow-hidden whitespace-nowrap text-sm font-medium transition-all duration-300 ease-in-out ${
                isOpen ? 'max-w-[120px] opacity-100' : 'max-w-0 opacity-0'
              }`}
            >
              Sign in
            </span>
          </button>
        )}
      </div>
    </aside>
  );
}

export function MainShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, logout, user } = useUserAuth();
  const { data: currentUserData } = useCurrentUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarAction, setSidebarAction] =
    useState<MainShellSidebarAction | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null
  );
  const sidebarActionContextValue = useMemo(() => ({ setSidebarAction }), []);
  const shellChromeContextValue = useMemo(
    () => ({
      sidebarOpen,
      toggleSidebar: () => setSidebarOpen((prev) => !prev),
    }),
    [sidebarOpen]
  );
  const userAvatar =
    user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null;
  const userName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email ??
    'User';
  const isAdmin = currentUserData?.data?.role === 'ADMIN';

  useEffect(() => {
    if (!pendingNavigation || sidebarOpen) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      router.push(pendingNavigation);
      setPendingNavigation(null);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [pendingNavigation, router, sidebarOpen]);

  if (!isShellRoute(pathname)) {
    return (
      <MainShellSidebarActionProvider value={sidebarActionContextValue}>
        {children}
      </MainShellSidebarActionProvider>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleSidebarNavigation = (href: string) => {
    if (href === pathname) {
      setSidebarOpen(false);
      return;
    }

    if (!sidebarOpen) {
      router.push(href);
      return;
    }

    setPendingNavigation(href);
    setSidebarOpen(false);
  };

  return (
    <MainShellSidebarActionProvider value={sidebarActionContextValue}>
      <MainShellChromeProvider value={shellChromeContextValue}>
        <div className="h-dvh overflow-hidden bg-[#fcfaf8]">
          <div className="relative flex h-full w-full overflow-hidden">
            <ShellSidebar
              isOpen={sidebarOpen}
              isAuthenticated={isAuthenticated}
              isAdmin={isAdmin}
              leadingAction={sidebarAction}
              userAvatar={userAvatar}
              userName={userName}
              onLeadingAction={(action) => {
                action.onClick();
                setSidebarOpen(false);
              }}
              onNavigate={handleSidebarNavigation}
              onPrimaryAction={() => {
                if (isAuthenticated) {
                  void handleLogout();
                  return;
                }

                setLoginOpen(true);
              }}
            />

            <div className="flex min-w-0 flex-1 flex-col p-3">
              <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden border-[3px] border-[#fcfaf8] bg-[#fcfaf8]">
                <div className="relative h-full w-full overflow-hidden border-[3px] border-black bg-white">
                  {pathname !== '/about' && pathname !== '/admin' && (
                    <button
                      type="button"
                      onClick={() => setSidebarOpen((prev) => !prev)}
                      className="group absolute left-4 top-12 z-30 h-14 w-14 overflow-hidden border-[3px] border-border transition-colors sm:left-6 sm:top-14"
                      aria-label={
                        sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'
                      }
                    >
                      <div className="absolute inset-0 bg-card transition-all group-hover:bg-[#f6cb48] group-active:bg-[#f6cb48]" />
                      <span className="relative flex h-full w-full flex-col items-center justify-center gap-1.5 text-foreground">
                        <span className="block h-0.5 w-6 rounded-full bg-current" />
                        <span className="block h-0.5 w-6 rounded-full bg-current" />
                        <span className="block h-0.5 w-6 rounded-full bg-current" />
                      </span>
                    </button>
                  )}

                  {children}
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainShellChromeProvider>
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle className="sr-only">Login</DialogTitle>
          <LoginForm />
        </DialogContent>
      </Dialog>
    </MainShellSidebarActionProvider>
  );
}
