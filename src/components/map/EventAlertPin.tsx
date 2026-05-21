'use client';

import React, { useState, useCallback } from 'react';

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
      className="group relative cursor-pointer"
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
      {/* Pulsing ring */}
      <span
        className="absolute inset-0 -m-1 animate-ping rounded-full opacity-60"
        style={{ backgroundColor: event.bannerColor }}
      />

      {/* Main circle */}
      <div
        className="relative flex h-8 w-8 items-center justify-center rounded-full shadow-lg ring-2 ring-white transition-transform duration-200"
        style={{
          backgroundColor: event.bannerColor,
          transform: isHovered ? 'scale(1.2)' : 'scale(1)',
        }}
      >
        {/* Camera icon */}
        <svg
          className="h-4 w-4 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </div>

      {/* Event name label */}
      <div
        className="absolute left-1/2 mt-1 -translate-x-1/2 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm"
        style={{ backgroundColor: event.bannerColor }}
      >
        {event.name.length > 16 ? `${event.name.slice(0, 14)}…` : event.name}
      </div>

      {/* Pin tail */}
      <div className="flex justify-center pt-0.5">
        <div className="h-2 w-0.5 rounded-b-full bg-gray-700" />
      </div>
    </div>
  );
});

EventAlertPin.displayName = 'EventAlertPin';
