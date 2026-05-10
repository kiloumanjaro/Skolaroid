'use client';

import { useEffect } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { useAnyPanelOpen } from '@/components/main-shell-sidebar-action';

interface AdminAnnouncementStripProps {
  announcements: string[];
}

export function AdminAnnouncementStrip({
  announcements,
}: AdminAnnouncementStripProps) {
  const controls = useAnimationControls();
  const paused = useAnyPanelOpen();

  useEffect(() => {
    if (paused) {
      controls.stop();
      return;
    }

    void controls.start({
      x: ['-50%', '0%'],
      transition: {
        duration: 18,
        ease: 'linear',
        repeat: Infinity,
        repeatType: 'loop',
      },
    });
  }, [controls, paused]);

  return (
    <div className="overflow-hidden border-b-2 border-black bg-[#ffd9b8]">
      <motion.div
        className="flex w-max"
        animate={controls}
        aria-label="Admin announcements"
      >
        {[0, 1].map((group) => (
          <div
            key={group}
            className="flex shrink-0 items-center py-2"
            aria-hidden={group > 0}
          >
            {announcements.map((announcement) => (
              <div
                key={`${group}-${announcement}`}
                className="flex shrink-0 items-center gap-4 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-black sm:text-sm"
              >
                <span>{announcement}</span>
                <span className="text-black/70">/</span>
              </div>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
