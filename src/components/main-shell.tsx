'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
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
