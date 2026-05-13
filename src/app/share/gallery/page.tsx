import { Suspense } from 'react';
import ShareGalleryPageClient from './gallery-client';

export const dynamic = 'force-dynamic';

export default function ShareGalleryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh items-center justify-center">
          <p className="font-hand text-lg text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <ShareGalleryPageClient />
    </Suspense>
  );
}
