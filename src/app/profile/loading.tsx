import { ProfileAnnouncementStrip } from '@/components/announcement-strips/ProfileAnnouncementStrip';
import { ProfilePageSkeleton } from '@/components/profile/ProfilePageSkeleton';
import { PROFILE_ANNOUNCEMENTS } from '@/components/announcement-strips/announcement-config';

export default function ProfileLoading() {
  return (
    <div className="flex w-full flex-1 flex-col overflow-hidden">
      <ProfileAnnouncementStrip announcements={PROFILE_ANNOUNCEMENTS} />
      <div className="flex-1 pt-6 sm:pt-8">
        <div className="mx-auto w-full max-w-6xl px-5 pb-10 md:px-6">
          <ProfilePageSkeleton />
        </div>
      </div>
    </div>
  );
}
