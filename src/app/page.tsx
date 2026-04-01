'use client';

import { useState, useRef, useEffect } from 'react';
import { BatchCard } from '@/components/batch-card';
import { BatchSidebar } from '@/components/batch-sidebar';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { LoginForm } from '@/components/login-form';
import { useUserAuth } from '@/lib/hooks/useUserAuth';
import { AccountMenu } from '@/components/account-menu';

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

// Era-based navigation for sidebar (Latest to Oldest)
const eras = [
  {
    decade: 2020,
    label: '2020s',
    color: 'bg-blue-100',
    imageUrl: '', // Add Oblation statue photo from 2020s era here
  },
  {
    decade: 2010,
    label: '2010s',
    color: 'bg-green-100',
    imageUrl: '', // Add Oblation statue photo from 2010s era here
  },
  {
    decade: 2000,
    label: '2000s',
    color: 'bg-yellow-100',
    imageUrl: '', // Add Oblation statue photo from 2000s era here
  },
  {
    decade: 1990,
    label: '1990s',
    color: 'bg-purple-100',
    imageUrl: '', // Add Oblation statue photo from 1990s era here
  },
];

export default function Home() {
  const { isAuthenticated, loading } = useUserAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const drawerContentRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  // After login, check for a stored invite redirect
  useEffect(() => {
    if (!loading && isAuthenticated) {
      const pendingRedirect = sessionStorage.getItem('invite_redirect');
      if (pendingRedirect) {
        sessionStorage.removeItem('invite_redirect');
        window.location.href = pendingRedirect;
      }
    }
  }, [loading, isAuthenticated]);

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
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Auth Buttons - Fixed top right */}
      <div className="fixed right-5 top-3 z-50 flex items-center gap-3">
        {!loading && isAuthenticated ? (
          <AccountMenu />
        ) : (
          <>
            <button
              onClick={() => setLoginOpen(true)}
              className="rounded-md bg-skolaroid-blue px-4 py-2 text-xs text-white transition hover:bg-blue-700"
            >
              Sign in
            </button>
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
          className="fixed inset-0 z-30 bg-black/20 transition-opacity duration-300"
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
          <h1 className="!text-5xl font-normal tracking-tight text-gray-800 dark:text-gray-100 md:text-4xl lg:text-5xl">
            turn your memories
            <br />
            into{' '}
            <span className="font-dancing !text-6xl text-skolaroid-blue">
              Skolaroids
            </span>
          </h1>

          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="group relative h-16 w-40 overflow-hidden rounded-[10px] outline outline-1 outline-neutral-300 transition-all"
            aria-label="Explore Skolaroid"
          >
            <div className="absolute left-0 top-0 h-16 w-40 rounded-[5px] bg-gradient-to-b from-neutral-50/50 to-gray-400/50 transition-all group-hover:bg-skolaroid-blue group-active:bg-skolaroid-blue" />
            <div className="relative flex h-16 w-40 items-center justify-center text-center font-['Inter'] text-lg font-medium text-neutral-700 transition-colors group-hover:text-white group-active:text-white">
              {drawerOpen ? 'Close' : 'Explore'}
            </div>
          </button>
        </div>
      </div>
    </main>
  );
}
