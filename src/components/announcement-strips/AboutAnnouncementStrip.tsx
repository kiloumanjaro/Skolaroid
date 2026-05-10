'use client';

import { AnnouncementMarqueeTrack } from './AnnouncementMarqueeTrack';
import type { AnnouncementItem } from './announcement-config';

interface AboutAnnouncementStripProps {
  announcements: AnnouncementItem[];
}

export function AboutAnnouncementStrip({
  announcements,
}: AboutAnnouncementStripProps) {
  return (
    <div className="overflow-hidden border-b-2 border-border bg-[#fff1c7]">
      <AnnouncementMarqueeTrack
        announcements={announcements}
        ariaLabel="About page announcements"
        itemClassName="flex shrink-0 items-center gap-4 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-foreground sm:text-sm"
        separatorClassName="text-foreground/60"
      />
    </div>
  );
}
