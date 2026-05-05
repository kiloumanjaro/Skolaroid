'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { GalleryExperience } from '@/components/gallery/GalleryExperience';
import { usePublicGalleryMemories } from '@/lib/hooks/usePublicGalleryMemories';

function ShareGalleryPageContent() {
  const searchParams = useSearchParams();
  const era = parseInt(searchParams.get('era') ?? '2020', 10);

  const { data: response, isLoading, error } = usePublicGalleryMemories(era);

  return (
    <div className="h-dvh overflow-hidden bg-[#fcfaf8] p-3">
      <div className="relative h-full min-h-0 min-w-0 overflow-hidden border-[3px] border-[#fcfaf8] bg-[#fcfaf8]">
        <div className="relative h-full w-full overflow-hidden border-[3px] border-black bg-white">
          <GalleryExperience
            activeEra={era}
            memories={response?.data ?? []}
            isLoading={isLoading}
            error={error instanceof Error ? error : null}
            isPublicView
            emptyMessage="No public memories found for this era"
          />
        </div>
      </div>
    </div>
  );
}

export default function ShareGalleryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh items-center justify-center">
          <p className="font-hand text-lg text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <ShareGalleryPageContent />
    </Suspense>
  );
}
