'use client';

import React, { useState, useCallback } from 'react';
import { ClockIcon } from '@phosphor-icons/react';

interface EventAlertPinEvent {
  id: string;
  name: string;
  bannerColor: string;
}

interface EventAlertPinProps {
  event: EventAlertPinEvent;
  onClick?: (eventId: string) => void;
}

/**
 * Pure DOM component rendered inside a raw mapboxgl.Marker via createRoot.
 * Displays a pulsing colored ring to distinguish live events from memory pins.
 */
export const EventAlertPin = React.forwardRef<
  HTMLDivElement,
  EventAlertPinProps
>(({ event, onClick }, ref) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = useCallback(() => {
    onClick?.(event.id);
  }, [event.id, onClick]);

  return (
    <div
      ref={ref}
      className="relative h-8 w-8 cursor-pointer"
      style={{ zIndex: 1000 }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      aria-label={`Live event: ${event.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Pulsing ring — constrained to the same 32×32 box so it stays circular */}
      <span
        className="absolute inset-0 -m-1 animate-ping rounded-full opacity-60"
        style={{ backgroundColor: '#7b91f7' }}
      />

      {/* Main circle */}
      <div
        className="relative flex h-8 w-8 items-center justify-center rounded-full shadow-lg ring-[1.5px] ring-black transition-transform duration-200"
        style={{
          backgroundColor: '#7b91f7',
          transform: isHovered ? 'scale(1.2)' : 'scale(1)',
        }}
      >
        <ClockIcon
          size={20}
          weight="duotone"
          className="event-alert-pin-icon"
          style={{ flexShrink: 0 }}
        />
      </div>
    </div>
  );
});

EventAlertPin.displayName = 'EventAlertPin';
