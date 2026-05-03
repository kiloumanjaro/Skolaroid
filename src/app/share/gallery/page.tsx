'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePublicGalleryMemories } from '@/lib/hooks/usePublicGalleryMemories';
import type { MemoryWithCoordinates } from '@/lib/hooks/useAllMemoriesWithCoordinates';

// ─── TEAMMATE INTEGRATION POINT ──────────────────────────────────────────────
// Replace this placeholder with your viewable-format UI component.
// Contract: receives `memories: MemoryWithCoordinates[]` and `era: number`.
// Example swap:
//   import { ViewableFormatUI } from '@/components/gallery/ViewableFormatUI';
//   return <ViewableFormatUI memories={memories} era={era} />;
function PublicGalleryDisplay({
  memories,
  era,
}: {
  memories: MemoryWithCoordinates[];
  era: number;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <p className="font-dancing text-3xl italic text-primary">Skolaroid</p>
      <p className="font-kalam text-xl text-foreground">({era}s)</p>
      <p className="font-hand text-sm text-muted-foreground">
        {memories.length} public {memories.length === 1 ? 'memory' : 'memories'}
      </p>
      {/* ── PLUG IN VIEWABLE FORMAT UI HERE ── */}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

function ShareGalleryPageContent() {
  const searchParams = useSearchParams();
  const era = parseInt(searchParams.get('era') ?? '2020', 10);

  const { data: response, isLoading, error } = usePublicGalleryMemories(era);
  const memories = response?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="font-hand text-lg text-muted-foreground">
          Loading memories...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="font-hand text-lg text-destructive">
          Failed to load memories.
        </p>
      </div>
    );
  }

  return <PublicGalleryDisplay memories={memories} era={era} />;
}

export default function ShareGalleryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <p className="font-hand text-lg text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <ShareGalleryPageContent />
    </Suspense>
  );
}
