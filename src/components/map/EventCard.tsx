'use client';

import { X, Camera, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog';

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

export function EventCard({
  event,
  onClose,
  onOpenPhotobooth,
}: EventCardProps) {
  return (
    <Dialog open={!!event} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="w-[calc(100vw-2rem)] max-w-2xl !rounded-none !shadow-none sm:w-[calc(100vw-4rem)]"
        showCloseButton={false}
      >
        {event && (
          <>
            <DialogTitle className="sr-only">Live Event</DialogTitle>
            {/* Header with banner color */}
            <div
              className="-mx-6 -mt-6 flex items-center justify-between border-b-2 border-black px-6 py-3"
              style={{ backgroundColor: event.bannerColor }}
            >
              <span className="text-sm font-bold uppercase tracking-wider text-white">
                Live Event
              </span>
              <button
                onClick={onClose}
                className="grid h-6 w-6 place-items-center border-2 border-black bg-white text-foreground shadow-[inset_1px_1px_0_#fff,inset_-1px_-1px_0_#999] transition hover:bg-gray-100 active:shadow-[inset_1px_1px_0_#ccc,inset_-1px_-1px_0_#fff]"
                aria-label="Close event card"
              >
                <X className="h-4 w-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold leading-tight text-foreground">
                  {event.name}
                </h3>

                {event.description && (
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                    {event.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 border-l-4 border-black py-2 pl-3 text-sm font-medium text-foreground">
                <Clock className="h-4 w-4 shrink-0" />
                <span>
                  {formatTime(event.startAt)} – {formatTime(event.endAt)}
                </span>
              </div>

              <button
                onClick={onOpenPhotobooth}
                className="flex w-full items-center justify-center gap-2 border-2 border-black px-4 py-3 text-sm font-bold uppercase tracking-wide text-white transition active:scale-95"
                style={{ backgroundColor: event.bannerColor }}
              >
                <Camera className="h-5 w-5" />
                Open Photobooth
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
