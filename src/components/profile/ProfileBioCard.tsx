'use client';

import { ProfilePanel } from '@/components/profile/profile-shell';

interface ProfileBioCardProps {
  bio?: string | null;
}

export function ProfileBioCard({ bio }: ProfileBioCardProps) {
  return (
    <ProfilePanel
      eyebrow="Story"
      title="About Me"
      description="A quick sketch classmates will see before they open your memories."
      accentClassName="bg-[#ffd7e5]"
    >
      {bio ? (
        <div className="border-2 border-border bg-[#fffaf0] p-5">
          <p className="whitespace-pre-wrap font-hand text-base leading-8 text-foreground/85">
            {bio}
          </p>
        </div>
      ) : (
        <div className="border-2 border-dashed border-border bg-[#fffaf0] px-5 py-8 text-center">
          <p className="font-hand text-sm italic text-muted-foreground">
            No bio added yet. Add a short intro so people can recognize your
            story.
          </p>
        </div>
      )}
    </ProfilePanel>
  );
}
