'use client';

import { useUserAuth } from '@/lib/hooks/useUserAuth';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { ProfileHero } from '@/components/profile/ProfileHero';
import { ProfileBioCard } from '@/components/profile/ProfileBioCard';
import { ProfileContactCard } from '@/components/profile/ProfileContactCard';
import { ProfileAcademicCard } from '@/components/profile/ProfileAcademicCard';
import { ProfileActivityCard } from '@/components/profile/ProfileActivityCard';
import { ProfileSettingsCard } from '@/components/profile/ProfileSettingsCard';
import { ProfileMemoriesCard } from '@/components/profile/ProfileMemoriesCard';

export default function ProfilePage() {
  const { user, loading } = useUserAuth();
  const { data: currentUserData, isLoading: dbUserLoading } = useCurrentUser();

  if (loading || dbUserLoading) {
    return (
      <div className="flex w-full flex-1 flex-col gap-6">
        <div className="h-32 animate-pulse rounded-xl bg-muted" />
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const dbUser = currentUserData?.data ?? null;

  return (
    <div className="flex w-full flex-1 flex-col gap-6">
      <ProfileHero user={user} dbUser={dbUser} />
      <div className="grid gap-6 md:grid-cols-2">
        <ProfileBioCard />
        <ProfileContactCard />
        <ProfileAcademicCard
          studentId={dbUser?.studentId}
          program={dbUser?.programBatch.program.name}
          batch={dbUser?.programBatch.batch.year}
          status={dbUser?.status}
        />
        <ProfileActivityCard />
        <ProfileMemoriesCard userId={dbUser?.id} />
        <ProfileSettingsCard />
      </div>
    </div>
  );
}
