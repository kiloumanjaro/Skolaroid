'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { LoginForm } from '@/components/login-form';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useUserAuth } from '@/lib/hooks/useUserAuth';

const shellRoutes = ['/map', '/gallery', '/about'];

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

function ShellSidebar({
  isOpen,
  isAuthenticated,
  onPrimaryAction,
  onNavigate,
}: {
  isOpen: boolean;
  isAuthenticated: boolean;
  onPrimaryAction: () => void;
  onNavigate: (href: string) => void;
}) {
  const pathname = usePathname();

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
        {navItems.map((item) => {
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
              className={`group relative flex h-12 items-center gap-3 overflow-hidden rounded-2xl px-3 transition-all duration-300 ease-in-out ${
                isActive
                  ? 'border-2 border-border shadow-[4px_4px_0px_0px_#2d2d2d] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#2d2d2d] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none'
                  : 'text-foreground/80 hover:bg-foreground/5 hover:text-foreground'
              }`}
            >
              {isActive && (
                <div className="absolute inset-0 rounded-2xl bg-[#f6cb48]" />
              )}
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
        <button
          type="button"
          onClick={onPrimaryAction}
          className="flex h-12 w-full items-center gap-3 rounded-2xl px-3 text-foreground/80 transition-all duration-300 ease-in-out hover:bg-foreground/5 hover:text-foreground"
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
            {isAuthenticated ? 'Logout' : 'Sign in'}
          </span>
        </button>
      </div>
    </aside>
  );
}

export function MainShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, logout } = useUserAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null
  );

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
    return <>{children}</>;
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
    <>
      <div className="h-dvh overflow-hidden bg-[#fcfaf8]">
        <div className="relative flex h-full w-full overflow-hidden">
          <ShellSidebar
            isOpen={sidebarOpen}
            isAuthenticated={isAuthenticated}
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
                <button
                  type="button"
                  onClick={() => setSidebarOpen((prev) => !prev)}
                  className="group absolute left-4 top-12 z-30 h-14 w-14 overflow-hidden border-[3px] border-border transition-all hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] sm:left-6 sm:top-14"
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

                {children}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle className="sr-only">Login</DialogTitle>
          <LoginForm />
        </DialogContent>
      </Dialog>
    </>
  );
}
