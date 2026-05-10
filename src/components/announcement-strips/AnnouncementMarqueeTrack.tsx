'use client';

import type { CSSProperties } from 'react';
import { useAnyPanelOpen } from '@/components/main-shell-sidebar-action';
import {
  ANNOUNCEMENT_SEPARATOR,
  ANNOUNCEMENT_SET_COPIES,
  ANNOUNCEMENT_SPEED_PER_ITEM_SECONDS,
  type AnnouncementItem,
} from './announcement-config';

interface AnnouncementMarqueeTrackProps {
  announcements: AnnouncementItem[];
  ariaLabel: string;
  itemClassName: string;
  separatorClassName: string;
}

type AnnouncementMarqueeStyle = CSSProperties & {
  '--announcement-duration': string;
};

export function AnnouncementMarqueeTrack({
  announcements,
  ariaLabel,
  itemClassName,
  separatorClassName,
}: AnnouncementMarqueeTrackProps) {
  const paused = useAnyPanelOpen();
  const announcementCopies = Array.from(
    { length: ANNOUNCEMENT_SET_COPIES },
    (_, copy) => copy
  );
  const animationDuration = `${announcements.length * ANNOUNCEMENT_SPEED_PER_ITEM_SECONDS}s`;
  const marqueeStyle: AnnouncementMarqueeStyle = {
    '--announcement-duration': animationDuration,
    animationPlayState: paused ? 'paused' : 'running',
  };

  return (
    <div
      className="announcement-marquee flex w-max"
      style={marqueeStyle}
      aria-label={ariaLabel}
    >
      {announcementCopies.map((copy) => (
        <div
          key={copy}
          className="flex shrink-0 items-center py-2"
          aria-hidden={copy > 0}
        >
          {announcements.map((announcement, index) => (
            <div
              key={`${copy}-${index}-${announcement.text}`}
              className={itemClassName}
            >
              <span>{announcement.text}</span>
              <span className={separatorClassName}>
                {ANNOUNCEMENT_SEPARATOR}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
