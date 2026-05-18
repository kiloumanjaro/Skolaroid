'use client';

import { AnnouncementMarqueeTrack } from './AnnouncementMarqueeTrack';
import type { AnnouncementItem } from './announcement-config';

interface MapAnnouncementStripProps {
  announcements: AnnouncementItem[];
}

export function MapAnnouncementStrip({
  announcements,
}: MapAnnouncementStripProps) {
  return (
    <div className="overflow-hidden border-b-2 border-black bg-[#f6cb48]">
      <AnnouncementMarqueeTrack
        announcements={announcements}
        ariaLabel="Map announcements"
        itemClassName="flex shrink-0 items-center gap-4 pr-4 text-xs font-semibold uppercase tracking-[0.14em] text-black sm:text-sm"
        separatorClassName="text-black/70"
      />
    </div>
  );
}
