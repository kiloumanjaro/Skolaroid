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
import { ActivityTimelineModal } from '@/components/profile/ActivityTimelineModal';
import { ProfilePageSkeleton } from '@/components/profile/ProfilePageSkeleton';
import { MemoryDetailModal } from '@/components/map/MemoryDetailModal';
import { ProfileAnnouncementStrip } from '@/components/announcement-strips/ProfileAnnouncementStrip';
import { PROFILE_ANNOUNCEMENTS } from '@/components/announcement-strips/announcement-config';
import { ShellInlineSidebarToggle } from '@/components/shell-inline-sidebar-toggle';
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
    return (
      <div className="flex w-full flex-1 flex-col overflow-hidden">
        <div className="relative overflow-hidden">
          <div className="absolute left-4 top-12 z-20 sm:left-6 sm:top-14">
            <div className="flex items-center gap-3 sm:gap-4">
              <ShellInlineSidebarToggle />
              <div className="truncate text-3xl text-black sm:text-4xl md:text-5xl">
                Profile
              </div>
            </div>
          </div>

          <ProfileAnnouncementStrip announcements={PROFILE_ANNOUNCEMENTS} />
          <div className="flex-1 pt-20 sm:pt-24">
            <div className="mx-auto w-full max-w-6xl px-5 pb-10 md:px-6">
              <ProfilePageSkeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const dbUser = currentUserData?.data ?? null;

  return (
    <>
      <div className="flex w-full flex-1 flex-col overflow-hidden">
        <div className="relative overflow-hidden">
          <div className="absolute left-4 top-12 z-20 sm:left-6 sm:top-14">
            <div className="flex items-center gap-3 sm:gap-4">
              <ShellInlineSidebarToggle />
              <div className="truncate text-3xl text-black sm:text-4xl md:text-5xl">
                Profile
              </div>
            </div>
          </div>

          <ProfileAnnouncementStrip announcements={PROFILE_ANNOUNCEMENTS} />
          <div className="flex-1 pt-20 sm:pt-24">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 pb-10 md:px-6">
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
          </div>
        </div>
      </div>
      <EditProfileModal
        open={editOpen}
        onOpenChange={setEditOpen}
        dbUser={dbUser}
        authUser={user}
      />
      <ActivityTimelineModal
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
