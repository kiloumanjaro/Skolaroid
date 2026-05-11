'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Bell,
  CheckCircle,
  FileCheck,
  FileMinus,
  Loader2,
  Trash2,
  XCircle,
} from 'lucide-react';
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { LoginForm } from '@/components/login-form';
import {
  MainShellChromeProvider,
  MainShellSidebarActionProvider,
  type MainShellSidebarAction,
} from '@/components/main-shell-sidebar-action';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import {
  useMarkNotificationsRead,
  useNotifications,
  useUnreadNotificationCount,
} from '@/lib/hooks/useNotifications';
import { useUserAuth } from '@/lib/hooks/useUserAuth';
import { cn } from '@/lib/utils';

const shellRoutes = ['/map', '/gallery', '/profile', '/admin', '/about'];

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
    href: '/profile',
    label: 'Profile',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <circle
          cx="12"
          cy="8"
          r="3.25"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M5.75 18.25c1.58-2.62 4.02-3.93 6.25-3.93s4.67 1.31 6.25 3.93"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
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
];

function isShellRoute(pathname: string) {
  return shellRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'MEMORY_APPROVED':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'MEMORY_REJECTED':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'MEMORY_REMOVED':
      return <Trash2 className="h-4 w-4 text-red-600" />;
    case 'REPORT_RESOLVED':
      return <FileCheck className="h-4 w-4 text-blue-500" />;
    case 'REPORT_DISMISSED':
      return <FileMinus className="h-4 w-4 text-gray-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
}

function formatNotificationTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function FloatingNotificationsButton() {
  const [open, setOpen] = useState(false);
  const { data: unreadCount = 0, refetch: refetchUnreadCount } =
    useUnreadNotificationCount();
  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch: refetchNotifications,
  } = useNotifications({ enabled: open });
  const markRead = useMarkNotificationsRead();

  const notifications = data?.pages.flatMap((page) => page.data.items) ?? [];

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (nextOpen) {
      void refetchUnreadCount();
      void refetchNotifications();
    }
  };

  const handleMarkAllRead = () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length > 0) {
      markRead.mutate(unreadIds);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="group absolute left-4 top-[6.25rem] z-30 h-10 w-10 overflow-hidden border-2 border-border transition-colors sm:left-6 sm:top-32 sm:h-14 sm:w-14 sm:border-[3px]"
          aria-label="Notifications"
        >
          <div className="absolute inset-0 bg-card transition-all group-hover:bg-[#f6cb48] group-active:bg-[#f6cb48]" />
          <span className="relative flex h-full w-full items-center justify-center text-foreground">
            <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
          </span>
          {unreadCount > 0 && (
            <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-semibold leading-none text-white sm:right-1 sm:top-1 sm:h-5 sm:min-w-5 sm:text-[10px]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className="z-50 w-80 max-w-[calc(100vw-2rem)] rounded-none border-2 border-[#2d2d2d] bg-[#fcfaf8] p-1 text-black shadow-none"
      >
        <div className="flex items-center justify-between border border-transparent px-2 py-1.5">
          <h3 className="text-[11px] font-black uppercase tracking-[0.1em] text-black">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="min-h-8 rounded-none border border-transparent px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-black transition-colors hover:border-[#2d2d2d] hover:bg-[#fff4fb] focus:border-[#2d2d2d] focus:bg-[#fff4fb] focus:text-black"
            >
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator className="my-1 bg-[#2d2d2d]" />
        <div className="max-h-96 overflow-y-auto overflow-x-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-black" />
            </div>
          ) : notifications.length > 0 ? (
            <>
              {notifications.map((notification) => (
                <div key={notification.id}>
                  <DropdownMenuItem
                    className="min-h-8 w-full cursor-pointer rounded-none border border-transparent bg-transparent px-2 py-2 text-black hover:bg-[#fff4fb] focus:border-[#2d2d2d] focus:bg-[#fff4fb] focus:text-black data-[highlighted]:border-[#2d2d2d] data-[highlighted]:bg-[#fff4fb] data-[highlighted]:text-black"
                    onSelect={(event) => {
                      event.preventDefault();
                      if (!notification.read) {
                        markRead.mutate([notification.id]);
                      }
                    }}
                  >
                    <div className="flex w-full gap-3">
                      <div className="mt-1 flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`break-words text-sm ${
                            notification.read
                              ? 'text-black/65'
                              : 'font-semibold text-black'
                          }`}
                        >
                          {notification.message}
                        </p>
                        {notification.reason && (
                          <p className="mt-0.5 break-words text-xs italic text-black/60">
                            Reason: {notification.reason}
                          </p>
                        )}
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-black/55">
                          {formatNotificationTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                </div>
              ))}
              {hasNextPage && (
                <DropdownMenuItem
                  className="min-h-8 cursor-pointer justify-center rounded-none border border-transparent px-2 py-1.5 text-center text-[11px] font-semibold uppercase tracking-[0.1em] text-black focus:border-[#2d2d2d] focus:bg-[#fff4fb] focus:text-black data-[highlighted]:border-[#2d2d2d] data-[highlighted]:bg-[#fff4fb] data-[highlighted]:text-black"
                  onSelect={(event) => {
                    event.preventDefault();
                    fetchNextPage();
                  }}
                >
                  {isFetchingNextPage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Load more'
                  )}
                </DropdownMenuItem>
              )}
            </>
          ) : (
            <div className="py-8 text-center text-[11px] font-semibold uppercase tracking-[0.1em] text-black/60">
              No notifications yet
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProfileLogoutAction({
  isOpen,
  onLogout,
  profileHref,
  avatarUrl,
  avatarAlt,
  batchLabel,
}: {
  isOpen: boolean;
  onLogout: () => void;
  profileHref: string;
  avatarUrl?: string | null;
  avatarAlt: string;
  batchLabel?: string | null;
}) {
  return (
    <div className="flex items-center gap-2">
      <Link
        href={profileHref}
        className="group flex min-w-0 flex-1 items-center gap-3 overflow-hidden rounded-none px-1 py-1 text-left text-foreground"
        aria-label="Go to profile"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden bg-[#539fff] text-black">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={avatarAlt}
              width={40}
              height={40}
              draggable={false}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          ) : (
            <span className="text-sm font-black uppercase tracking-[0.12em]">
              {avatarAlt.charAt(0)}
            </span>
          )}
        </div>
        <div
          className={`min-w-0 overflow-hidden transition-all duration-300 ease-in-out ${
            isOpen ? 'max-w-[140px] opacity-100' : 'max-w-0 opacity-0'
          }`}
        >
          <p className="truncate text-sm font-semibold text-foreground">
            {avatarAlt}
          </p>
          {batchLabel && (
            <p className="truncate text-xs text-muted-foreground">
              {batchLabel}
            </p>
          )}
        </div>
      </Link>

      <button
        type="button"
        onClick={onLogout}
        className="flex h-10 w-10 shrink-0 items-center justify-center text-foreground/80 transition-colors hover:text-foreground"
        aria-label="Log out"
      >
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
      </button>
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
  userBatchLabel,
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
  userBatchLabel?: string | null;
  onPrimaryAction: () => void;
  onLeadingAction: (action: MainShellSidebarAction) => void;
  onNavigate: (href: string) => void;
}) {
  const pathname = usePathname();
  const visibleNavItems = isAdmin
    ? navItems
    : navItems.filter((item) => item.href !== '/admin');
  const adminNavItem = visibleNavItems.find((item) => item.href === '/admin');
  const primaryNavItems = visibleNavItems.filter(
    (item) => item.href !== '/admin'
  );

  return (
    <aside
      className={`relative z-40 flex h-full flex-col overflow-hidden bg-white text-foreground transition-all duration-300 ease-in-out ${
        isOpen ? 'w-52 sm:w-64' : 'w-0'
      }`}
    >
      <div className="flex items-center px-4 pb-6 pt-6">
        <div
          className={`flex justify-center overflow-hidden transition-all duration-300 ease-in-out ${
            isOpen ? 'max-w-[220px] opacity-100' : 'max-w-0 opacity-0'
          }`}
        >
          <p className="whitespace-nowrap font-dancing text-3xl font-bold leading-none text-skolaroid-blue sm:text-4xl">
            Skolaroid
          </p>
        </div>
      </div>

      <nav className="flex flex-col gap-2 px-2">
        {primaryNavItems.map((item) => {
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

        {leadingAction && (
          <Suspense
            fallback={
              <LeadingActionButton
                action={leadingAction}
                isOpen={isOpen}
                isActive={false}
                onClick={() => onLeadingAction(leadingAction)}
              />
            }
          >
            <SearchAwareLeadingActionButton
              action={leadingAction}
              isOpen={isOpen}
              onClick={() => onLeadingAction(leadingAction)}
            />
          </Suspense>
        )}

        {adminNavItem &&
          (() => {
            const isActive =
              pathname === adminNavItem.href ||
              pathname.startsWith(`${adminNavItem.href}/`);

            return (
              <Link
                key={adminNavItem.href}
                href={adminNavItem.href}
                onClick={(event) => {
                  event.preventDefault();
                  onNavigate(adminNavItem.href);
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
                  {adminNavItem.icon}
                </span>
                <span
                  className={`relative overflow-hidden whitespace-nowrap text-sm font-medium transition-all duration-300 ease-in-out ${
                    isOpen ? 'max-w-[120px] opacity-100' : 'max-w-0 opacity-0'
                  } ${isActive ? 'text-foreground' : ''}`}
                >
                  {adminNavItem.label}
                </span>
              </Link>
            );
          })()}
      </nav>

      <div className="mt-auto px-2 pb-3 pt-6">
        {isAuthenticated ? (
          <ProfileLogoutAction
            isOpen={isOpen}
            onLogout={onPrimaryAction}
            profileHref="/profile"
            avatarUrl={userAvatar}
            avatarAlt={userName}
            batchLabel={userBatchLabel}
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

function LeadingActionButton({
  action,
  isOpen,
  isActive,
  onClick,
}: {
  action: MainShellSidebarAction;
  isOpen: boolean;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex h-12 items-center gap-3 overflow-hidden px-3 transition-all duration-300 ease-in-out',
        isActive
          ? 'rounded-none border-2 border-black bg-white text-foreground'
          : 'rounded-none text-foreground/80 hover:bg-foreground/5 hover:text-foreground'
      )}
    >
      {isActive && <div className="absolute inset-0 bg-white" />}
      <span className="relative flex h-6 w-6 shrink-0 items-center justify-center">
        {action.icon}
      </span>
      <span
        className={`relative overflow-hidden whitespace-nowrap text-sm font-medium transition-all duration-300 ease-in-out ${
          isOpen ? 'max-w-[120px] opacity-100' : 'max-w-0 opacity-0'
        }`}
      >
        {action.label}
      </span>
    </button>
  );
}

function SearchAwareLeadingActionButton({
  action,
  isOpen,
  onClick,
}: {
  action: MainShellSidebarAction;
  isOpen: boolean;
  onClick: () => void;
}) {
  const searchParams = useSearchParams();
  const isActive =
    action.label === 'Batches' && searchParams.get('openBatches') === '1';

  return (
    <LeadingActionButton
      action={action}
      isOpen={isOpen}
      isActive={isActive}
      onClick={onClick}
    />
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
  const [openPanelCount, setOpenPanelCount] = useState(0);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null
  );
  const sidebarActionContextValue = useMemo(() => ({ setSidebarAction }), []);
  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);
  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);
  const registerOpenPanel = useCallback(() => {
    setOpenPanelCount((count) => count + 1);
  }, []);
  const unregisterOpenPanel = useCallback(() => {
    setOpenPanelCount((count) => Math.max(0, count - 1));
  }, []);
  const shellChromeContextValue = useMemo(
    () => ({
      sidebarOpen,
      toggleSidebar,
      closeSidebar,
      openPanelCount,
      registerOpenPanel,
      unregisterOpenPanel,
    }),
    [
      closeSidebar,
      openPanelCount,
      registerOpenPanel,
      sidebarOpen,
      toggleSidebar,
      unregisterOpenPanel,
    ]
  );
  const userAvatar =
    user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null;
  const userName =
    currentUserData?.data != null
      ? `${currentUserData.data.firstName} ${currentUserData.data.lastName}`
      : (user?.user_metadata?.full_name ??
        user?.user_metadata?.name ??
        user?.email ??
        'User');
  const userBatchLabel = currentUserData?.data?.programBatch?.batch?.year
    ? `Batch ${currentUserData.data.programBatch.batch.year}`
    : null;
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
              userBatchLabel={userBatchLabel}
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

            <div
              className={`flex min-w-0 flex-1 flex-col p-3 transition-[padding] duration-300 ease-in-out ${
                sidebarOpen ? 'pl-0' : 'pl-3'
              }`}
            >
              <div
                className={`relative min-h-0 min-w-0 flex-1 overflow-hidden bg-[#fcfaf8] ${
                  sidebarOpen
                    ? 'border-b-[3px] border-r-[3px] border-t-[3px] border-[#fcfaf8]'
                    : 'border-[3px] border-[#fcfaf8]'
                }`}
              >
                <div className="relative h-full w-full overflow-hidden border-[3px] border-black bg-white">
                  {pathname !== '/about' && pathname !== '/admin' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setSidebarOpen((prev) => !prev)}
                        className="group absolute left-4 top-12 z-30 h-10 w-10 overflow-hidden border-2 border-border transition-colors sm:left-6 sm:top-14 sm:h-14 sm:w-14 sm:border-[3px]"
                        aria-label={
                          sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'
                        }
                      >
                        <div className="absolute inset-0 bg-card transition-all group-hover:bg-[#f6cb48] group-active:bg-[#f6cb48]" />
                        <span className="relative flex h-full w-full flex-col items-center justify-center gap-1.5 text-foreground">
                          <span className="block h-0.5 w-5 rounded-full bg-current sm:w-6" />
                          <span className="block h-0.5 w-5 rounded-full bg-current sm:w-6" />
                          <span className="block h-0.5 w-5 rounded-full bg-current sm:w-6" />
                        </span>
                      </button>
                      {isAuthenticated && pathname === '/map' && (
                        <FloatingNotificationsButton />
                      )}
                    </>
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
