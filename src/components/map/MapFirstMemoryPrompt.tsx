'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin } from 'lucide-react';

interface MapFirstMemoryPromptProps {
  onAddMemory: () => void;
}

export function MapFirstMemoryPrompt({
  onAddMemory,
}: MapFirstMemoryPromptProps) {
  const [dismissed, setDismissed] = useState(false);

  return (
    <AnimatePresence>
      {!dismissed && (
        // Wrapper: pointer-events:none so map stays fully interactive behind the card
        <motion.div
          className="pointer-events-none absolute bottom-20 left-0 right-0 z-20 flex justify-center px-4 sm:bottom-24"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.3 }}
        >
          {/* Card: pointer-events:auto restores interactivity on the card itself */}
          <div className="pointer-events-auto relative w-full max-w-xs rounded-xl border border-border bg-card p-4 shadow-lg sm:max-w-sm">
            {/* Dismiss */}
            <button
              onClick={() => setDismissed(true)}
              className="absolute right-3 top-3 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Dismiss prompt"
            >
              <X size={14} />
            </button>

            {/* Icon + headline */}
            <div className="mb-1 flex items-center gap-2">
              <MapPin size={16} className="shrink-0 text-primary" />
              <p className="font-kalam text-base font-bold leading-tight text-foreground">
                Leave your mark.
              </p>
            </div>

            {/* Body */}
            <p className="mb-3 font-hand text-sm text-muted-foreground">
              No one has pinned your story here yet. Add your first memory to
              the map.
            </p>

            {/* CTA */}
            <button
              onClick={onAddMemory}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-hand text-sm font-medium text-primary-foreground shadow transition-all hover:bg-primary/90 active:scale-95"
            >
              Pin a Memory
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
