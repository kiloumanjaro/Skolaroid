'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BatchCard } from '@/components/batch-card';
import { BatchSidebar } from '@/components/batch-sidebar';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { LoginForm } from '@/components/login-form';
import { useUserAuth } from '@/lib/hooks/useUserAuth';
import { AccountMenu } from '@/components/account-menu';
import { Button } from '@/components/ui/button';

const batches = [
  {
    year: 2020,
    message: 'We survived online classes! 💻',
    position: 'absolute top-40 left-40',
  },
  {
    year: 2021,
    message: 'Zoom University graduates! 🎓',
    position: 'absolute top-40 left-1/3',
  },
  {
    year: 2022,
    message: 'Back to campus vibes! 🏛️',
    position: 'absolute top-1/2 left-48 -translate-y-1/2',
  },
  {
    year: 2023,
    message: 'Hey! We just graduated 🎉',
    position: 'absolute top-32 right-56',
  },
  {
    year: 2024,
    message: 'Making memories together 📸',
    position: 'absolute top-64 right-40',
  },
  {
    year: 2025,
    message: 'Living our best college life! ✨',
    position: 'absolute bottom-40 right-56',
  },
  {
    year: 2026,
    message: 'First day jitters! 🎒',
    position: 'absolute bottom-40 left-48',
  },
];

export default function Home() {
  const { isAuthenticated, loading } = useUserAuth();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const drawerContentRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  // Era-based navigation for sidebar (Latest to Oldest: 2020s → 1990s)
  const eras = [
    {
      decade: 2020,
      label: '2020s',
      color: 'bg-sky-100',
      imageUrl: '', // TODO: Add Oblation statue photo from 2020s era
    },
    {
      decade: 2010,
      label: '2010s',
      color: 'bg-slate-100',
      imageUrl: '', // TODO: Add Oblation statue photo from 2010s era
    },
    {
      decade: 2000,
      label: '2000s',
      color: 'bg-green-100',
      imageUrl: '', // TODO: Add Oblation statue photo from 2000s era
    },
    {
      decade: 1990,
      label: '1990s',
      color: 'bg-amber-100',
      imageUrl: '', // TODO: Add Oblation statue photo from 1990s era
    },
  ];

  // After login, check for a stored invite redirect
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
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !drawerContentRef.current) return;
      e.preventDefault();
      const y = e.pageY;
      const walk = (startY - y) * 2;
      drawerContentRef.current.scrollTop = scrollTop + walk;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startY, scrollTop]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!drawerContentRef.current) return;
    setIsDragging(true);
    setStartY(e.pageY);
    setScrollTop(drawerContentRef.current.scrollTop);
  };

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden">
      {/* Auth Buttons - Fixed top right */}
      <div className="fixed right-5 top-3 z-50 flex items-center gap-3">
        {!loading && isAuthenticated ? (
          <AccountMenu />
        ) : (
          <>
            <Button onClick={() => setLoginOpen(true)} size="sm">
              Sign in
            </Button>
          </>
        )}
      </div>

      {/* Login Modal */}
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle className="sr-only">Login</DialogTitle>
          <LoginForm />
        </DialogContent>
      </Dialog>

      <BatchSidebar
        drawerOpen={drawerOpen}
        setDrawerOpen={setDrawerOpen}
        isDragging={isDragging}
        isAuthenticated={isAuthenticated}
        setLoginOpen={setLoginOpen}
        eras={eras}
        onMouseDown={handleMouseDown}
        drawerContentRef={drawerContentRef}
      />

      {/* Overlay - Click to close drawer */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-30 bg-[#2d2d2d]/20 transition-opacity duration-300"
          onClick={() => setDrawerOpen(false)}
          aria-label="Close drawer overlay"
        />
      )}

      {/* Content Container - Shifts right when drawer opens */}
      <div
        className={`fixed inset-0 z-10 transition-all duration-300 ease-in-out ${
          drawerOpen ? 'ml-[600px]' : 'ml-0'
        }`}
      >
        {/* Batch Cards - Scattered Layout */}
        <div className="pointer-events-none">
          {batches.map((batch) => (
            <BatchCard
              key={batch.year}
              year={batch.year}
              message={batch.message}
              position={batch.position}
            />
          ))}
        </div>

        {/* Hero Section - Centered */}
        <div className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="!text-5xl font-normal tracking-tight text-foreground md:text-4xl lg:text-5xl">
            turn your memories
            <br />
            into{' '}
            <span className="font-dancing !text-6xl text-skolaroid-blue">
              Skolaroids
            </span>
          </h1>

          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="group relative h-16 w-40 overflow-hidden border-2 border-border shadow-[4px_4px_0px_0px_#2d2d2d] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#2d2d2d] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
            aria-label="Explore Skolaroid"
          >
            <div className="absolute left-0 top-0 h-16 w-40 bg-card transition-all group-hover:bg-skolaroid-blue group-active:bg-skolaroid-blue" />
            <div className="relative flex h-16 w-40 items-center justify-center text-center text-lg font-medium text-foreground transition-colors group-hover:text-white group-active:text-white">
              {drawerOpen ? 'Close' : 'Explore'}
            </div>
          </button>
        </div>
      </div>
    </main>
  );
}
