'use client';

import { X, Camera, Clock } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface EventCardEvent {
  id: string;
  name: string;
  description?: string | null;
  startAt: string | Date;
  endAt: string | Date;
  bannerColor: string;
}

interface EventCardProps {
  event: EventCardEvent | null;
  onClose: () => void;
  onOpenPhotobooth: () => void;
}

function formatTime(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Overlay card shown when the user clicks an event alert pin.
 * Positioned over the map without blocking it (no dialog overlay).
 */
export function EventCard({
  event,
  onClose,
  onOpenPhotobooth,
}: EventCardProps) {
  return (
    <AnimatePresence>
      {event && (
        <motion.div
          key={event.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-24 left-4 z-40 w-72 overflow-hidden border-2 border-border bg-card shadow-[4px_4px_0px_0px_#2d2d2d]"
        >
          {/* Color strip header */}
          <div
            className="flex items-center justify-between px-3 py-2"
            style={{ backgroundColor: event.bannerColor }}
          >
            <span className="text-xs font-bold uppercase tracking-wide text-white">
              Live Event
            </span>
            <button
              onClick={onClose}
              className="rounded p-0.5 text-white/80 transition hover:text-white"
              aria-label="Close event card"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-3">
            <h3 className="text-sm font-semibold leading-tight text-foreground">
              {event.name}
            </h3>

            {event.description && (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {event.description}
              </p>
            )}

            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3 shrink-0" />
              <span>
                {formatTime(event.startAt)} – {formatTime(event.endAt)}
              </span>
            </div>

            <button
              onClick={onOpenPhotobooth}
              className="mt-3 flex w-full items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
              style={{ backgroundColor: event.bannerColor }}
            >
              <Camera className="h-3.5 w-3.5" />
              Open Photobooth
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
