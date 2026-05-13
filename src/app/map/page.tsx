import { Suspense } from 'react';
import MapPageClient from './map-client';

export const dynamic = 'force-dynamic';

export default function MapPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh items-center justify-center">
          <p className="text-lg text-gray-600">Loading map...</p>
        </div>
      }
    >
      <MapPageClient />
    </Suspense>
  );
}
