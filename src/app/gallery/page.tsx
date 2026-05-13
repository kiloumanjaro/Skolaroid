import { Suspense } from 'react';
import GalleryPageClient from './gallery-client';

export const dynamic = 'force-dynamic';

export default function GalleryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full flex-col items-center justify-center bg-gray-50">
          <p className="text-lg text-gray-600">Loading gallery...</p>
        </div>
      }
    >
      <GalleryPageClient />
    </Suspense>
  );
}
