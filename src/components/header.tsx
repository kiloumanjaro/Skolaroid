'use client';

import Link from 'next/link';
import { User } from 'lucide-react';
import { ClientNav } from './client-nav';
import { useUserAuth } from '@/lib/hooks/useUserAuth';
import { AccountMenu } from './account-menu';
import { NotificationsMenu } from './notifications-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeaderProps {
  hidden?: boolean;
  variant?: 'default' | 'floating';
}

export function Header({ hidden = false, variant = 'default' }: HeaderProps) {
  const { isAuthenticated, loading } = useUserAuth();
  const isFloating = variant === 'floating';

  return (
    <nav
      className={cn(
        isFloating
          ? 'pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 transition-transform duration-300 ease-in-out'
          : 'fixed left-0 right-0 top-0 z-50 flex w-full justify-center transition-transform duration-300 ease-in-out',
        isFloating
          ? hidden
            ? '-translate-y-full'
            : 'translate-y-0'
          : hidden
            ? '-translate-y-full'
            : 'translate-y-0'
      )}
    >
      <div
        className={cn(
          'group/header relative flex items-center border-2 border-border bg-card px-5 text-sm shadow-[2px_2px_0px_0px_#2d2d2d] transition-all duration-300 ease-out',
          isFloating
            ? 'pointer-events-auto h-16 w-[min(92vw,58rem)] rounded-[5px] bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/85 sm:w-[min(88vw,58rem)] sm:group-focus-within/header:w-[min(94vw,72rem)] sm:group-hover/header:w-[min(94vw,72rem)]'
            : 'h-16 w-[min(96vw,64rem)] sm:w-[min(92vw,64rem)] sm:group-focus-within/header:w-[min(96vw,80rem)] sm:group-hover/header:w-[min(96vw,80rem)]'
        )}
      >
        {/* Logo - Left */}
        <div className="font-semibold">
          <Link
            href="/"
            className="font-dancing text-2xl text-skolaroid-blue hover:text-skolaroid-blue/80"
          >
            skolaroid
          </Link>
        </div>

        {/* Nav - Centered */}
        <div className="absolute left-1/2 -translate-x-1/2 font-semibold">
          <ClientNav />
        </div>

        {/* Auth - Right */}
        <div className="ml-auto flex items-center gap-3">
          {loading ? (
            <div className="flex h-8 w-8 animate-pulse items-center justify-center rounded-full border-2 border-foreground bg-card text-foreground">
              <User className="h-4 w-4" />
            </div>
          ) : isAuthenticated ? (
            <>
              <NotificationsMenu />
              <AccountMenu />
            </>
          ) : (
            <Button
              asChild
              className="bg-skolaroid-blue text-xs hover:bg-skolaroid-blue/90"
            >
              <Link href="/">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
