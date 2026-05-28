import { Suspense } from 'react';
import GalleryPageClient from './gallery-client';

export const dynamic = 'force-dynamic';

export default function GalleryPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-secondary border-t-foreground" />
            <p className="text-sm text-muted-foreground">Loading gallery…</p>
          </div>
        </main>
      }
    >
      <GalleryPageClient />
    </Suspense>
  );
}
