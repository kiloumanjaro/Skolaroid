import { Suspense } from 'react';
import { AdminPageClient } from './admin-client';

export const dynamic = 'force-dynamic';

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <p className="text-lg text-gray-600">Loading admin dashboard...</p>
        </div>
      }
    >
      <AdminPageClient />
    </Suspense>
  );
}
