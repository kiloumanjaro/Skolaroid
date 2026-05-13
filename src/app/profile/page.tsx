import { Suspense } from 'react';
import { ProfilePageClient } from './profile-client';

export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <p className="text-lg text-gray-600">Loading profile...</p>
        </div>
      }
    >
      <ProfilePageClient />
    </Suspense>
  );
}
