'use client';

import { useAnyPanelOpen } from '@/components/main-shell-sidebar-action';

interface MapAnnouncementStripProps {
  announcements: string[];
}

export function MapAnnouncementStrip({
  announcements,
}: MapAnnouncementStripProps) {
  const paused = useAnyPanelOpen();

  return (
    <div className="overflow-hidden border-b-2 border-black bg-[#f6cb48]">
      <div
        className="announcement-marquee flex w-max"
        style={{ animationPlayState: paused ? 'paused' : 'running' }}
        aria-label="Map announcements"
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
      </div>
    </div>
  );
}
