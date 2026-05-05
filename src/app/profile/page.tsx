'use client';

import { useState } from 'react';
import { useUserAuth } from '@/lib/hooks/useUserAuth';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { ProfileHero } from '@/components/profile/ProfileHero';
import { ProfileBioCard } from '@/components/profile/ProfileBioCard';
import { ProfileContactCard } from '@/components/profile/ProfileContactCard';
import { ProfileAcademicCard } from '@/components/profile/ProfileAcademicCard';
import { ProfileActivityCard } from '@/components/profile/ProfileActivityCard';
import { ProfileSettingsCard } from '@/components/profile/ProfileSettingsCard';
import { ProfileMemoriesCard } from '@/components/profile/ProfileMemoriesCard';
import { EditProfileModal } from '@/components/profile/EditProfileModal';
import { ActivityTimelineDialog } from '@/components/profile/ActivityTimelineDialog';
import { ProfilePageSkeleton } from '@/components/profile/ProfilePageSkeleton';
import { MemoryDetailModal } from '@/components/map/MemoryDetailModal';
import type { MemoryWithCoordinates } from '@/lib/hooks/useAllMemoriesWithCoordinates';

export default function ProfilePage() {
  const { user, loading } = useUserAuth();
  const { data: currentUserData, isLoading: dbUserLoading } = useCurrentUser();
  const [editOpen, setEditOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [selectedActivityMemory, setSelectedActivityMemory] =
    useState<MemoryWithCoordinates | null>(null);
  const [memoryDetailOpen, setMemoryDetailOpen] = useState(false);

  if (loading || dbUserLoading) {
    return <ProfilePageSkeleton />;
  }

  const dbUser = currentUserData?.data ?? null;

  return (
    <>
      <div className="flex w-full flex-1 flex-col gap-6 pb-10">
        <ProfileHero
          user={user}
          dbUser={dbUser}
          onEditClick={() => setEditOpen(true)}
        />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.9fr)]">
          <div className="grid gap-6">
            <ProfileBioCard bio={dbUser?.bio} />
            <ProfileMemoriesCard userId={dbUser?.id} />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1">
            <ProfileContactCard
              phone={dbUser?.phone}
              linkedinUrl={dbUser?.linkedinUrl}
              facebookUrl={dbUser?.facebookUrl}
              contactOther={dbUser?.contactOther}
            />
            <ProfileAcademicCard
              studentId={dbUser?.studentId}
              program={dbUser?.programBatch.program.name}
              batch={dbUser?.programBatch.batch.year}
              status={dbUser?.status}
            />
            <ProfileActivityCard
              userId={dbUser?.id}
              onShowMore={() => setActivityOpen(true)}
            />
            <ProfileSettingsCard />
          </div>
        </div>
      </div>
      <EditProfileModal
        open={editOpen}
        onOpenChange={setEditOpen}
        dbUser={dbUser}
        authUser={user}
      />
      <ActivityTimelineDialog
        open={activityOpen}
        onOpenChange={setActivityOpen}
        userId={dbUser?.id}
        onMemorySelect={(memory) => {
          setSelectedActivityMemory(memory);
          setMemoryDetailOpen(true);
        }}
      />
      <MemoryDetailModal
        memory={selectedActivityMemory}
        open={memoryDetailOpen}
        onOpenChange={(v) => {
          setMemoryDetailOpen(v);
          if (!v) setSelectedActivityMemory(null);
        }}
      />
    </>
  );
}
