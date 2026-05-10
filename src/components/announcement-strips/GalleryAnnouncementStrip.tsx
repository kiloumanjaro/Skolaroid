'use client';

import { AnnouncementMarqueeTrack } from './AnnouncementMarqueeTrack';
import type { AnnouncementItem } from './announcement-config';

interface GalleryAnnouncementStripProps {
  announcements: AnnouncementItem[];
}

export function GalleryAnnouncementStrip({
  announcements,
}: GalleryAnnouncementStripProps) {
  return (
    <div className="overflow-hidden border-b-2 border-black bg-[#d6efff]">
      <AnnouncementMarqueeTrack
        announcements={announcements}
        ariaLabel="Gallery announcements"
        itemClassName="flex shrink-0 items-center gap-4 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-black sm:text-sm"
        separatorClassName="text-black/70"
      />
    </div>
  );
}
