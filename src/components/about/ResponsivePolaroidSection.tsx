'use client';

import { useEffect, useState } from 'react';
import { AboutPolaroid } from '@/components/about/AboutPolaroid';

interface PolaroidConfig {
  label: string;
  color: string;
  rotation: string;
  imageUrl?: string;
}

interface ResponsivePolaroidSectionProps {
  polaroids: PolaroidConfig[];
}

export function ResponsivePolaroidSection({
  polaroids,
}: ResponsivePolaroidSectionProps) {
  const [visibleCount, setVisibleCount] = useState(4);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const calculateVisibleCount = () => {
      const width = window.innerWidth;
      if (width < 480) return 1;
      if (width < 768) return 2;
      if (width < 1024) return 3;
      return 4;
    };

    setVisibleCount(calculateVisibleCount());

    const handleResize = () => {
      setVisibleCount(calculateVisibleCount());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!mounted) return null;

  const visiblePolaroids = polaroids.slice(0, visibleCount);

  // Max width for the entire grid based on card count (prevents mobile cards from being too large)
  const getGridMaxWidth = () => {
    if (visibleCount === 1) return '220px'; // Mobile: max 220px for 1 card
    if (visibleCount === 2) return '480px'; // Tablet: max 480px for 2 cards
    if (visibleCount === 3) return '750px'; // Tablet: max 750px for 3 cards
    return '100%'; // Desktop: full width for 4 cards
  };

  return (
    <section className="absolute left-0 right-0 top-full z-20 -translate-y-1/2 transform">
      <div className="mx-auto w-full max-w-7xl px-6 md:px-10 lg:px-16">
        {/* CSS Grid ensures cards scale responsively while centered.
            Positions this section to straddle the curve divider at all breakpoints. */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${visibleCount}, 1fr)`,
            gap: `${visibleCount === 1 ? '0' : 'clamp(2.5rem, 6vw, 5rem)'}`,
            maxWidth: getGridMaxWidth(),
            margin: '0 auto',
            justifyItems: 'center',
          }}
        >
          {visiblePolaroids.map((polaroid) => (
            <div
              key={polaroid.label}
              style={{
                width: '100%',
                minWidth: 0,
              }}
            >
              <AboutPolaroid
                label={polaroid.label}
                color={polaroid.color}
                rotation={polaroid.rotation}
                imageUrl={polaroid.imageUrl}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
