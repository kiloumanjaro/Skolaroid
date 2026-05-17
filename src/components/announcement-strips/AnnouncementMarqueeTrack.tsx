'use client';

import type { CSSProperties } from 'react';
import {
  HandGrabbingIcon,
  HandPointingIcon,
  HandPeaceIcon,
  HandPalmIcon,
  HandFistIcon,
  HandIcon,
} from '@phosphor-icons/react';
import { useAnyPanelOpen } from '@/components/shared/shell/main-shell-sidebar-action';
import {
  ANNOUNCEMENT_SET_COPIES,
  ANNOUNCEMENT_SPEED_PER_ITEM_SECONDS,
  type AnnouncementItem,
} from './announcement-config';

const HAND_SEPARATORS = [
  HandFistIcon,
  HandPointingIcon,
  HandPalmIcon,
  HandPeaceIcon,
  HandGrabbingIcon,
  HandIcon,
];

const AnnouncementSeparator = ({ index }: { index: number }) => {
  const Icon = HAND_SEPARATORS[index % HAND_SEPARATORS.length];
  return (
    <Icon
      size={20}
      weight="duotone"
      className="announcement-hand-icon"
      style={{ flexShrink: 0 }}
    />
  );
};

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
                <AnnouncementSeparator index={index} />
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
