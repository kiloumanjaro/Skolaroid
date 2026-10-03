import { Suspense } from 'react';
import { ProfilePageClient } from './profile-client';
import { ProfilePageSkeleton } from '@/components/profile/ProfilePageSkeleton';

export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-6xl px-5 pb-10 pt-6 sm:pt-8 md:px-6">
          <ProfilePageSkeleton />
        </div>
      }
    >
      <ProfilePageClient />
    </Suspense>
  );
}
