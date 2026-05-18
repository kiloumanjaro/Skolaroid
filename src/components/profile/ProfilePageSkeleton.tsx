import {
  ProfilePanel,
  ProfileSkeletonBlock,
} from '@/components/profile/profile-shell';

function ProfilePanelSkeleton({
  eyebrow,
  title,
  accentClassName,
  className,
}: {
  eyebrow: string;
  title: string;
  accentClassName: string;
  className?: string;
}) {
  return (
    <ProfilePanel
      eyebrow={eyebrow}
      title={title}
      accentClassName={accentClassName}
      className={className}
      contentClassName="space-y-3 p-5"
    >
      <ProfileSkeletonBlock className="h-4 w-11/12" />
      <ProfileSkeletonBlock className="h-4 w-4/5" />
      <ProfileSkeletonBlock className="h-20 w-full" />
    </ProfilePanel>
  );
}

function MemoriesSkeleton() {
  return (
    <ProfilePanel
      eyebrow=""
      title="My Memories"
      accentClassName="bg-[#ffe3b3]"
      contentClassName="grid gap-4 md:grid-cols-2"
    >
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden border-2 border-border bg-background"
        >
          <ProfileSkeletonBlock className="h-40 w-full border-0 border-b-2" />
          <div className="space-y-3 p-4">
            <ProfileSkeletonBlock className="h-5 w-2/3" />
            <ProfileSkeletonBlock className="h-4 w-1/2" />
            <ProfileSkeletonBlock className="h-10 w-full" />
          </div>
        </div>
      ))}
    </ProfilePanel>
  );
}

export function ProfilePageSkeleton() {
  return (
    <div className="flex w-full flex-1 flex-col gap-6 pb-10">
      <section className="overflow-hidden border-2 border-border bg-card shadow-none">
        <div className="border-b-2 border-border bg-[#fff4a8] px-5 py-3">
          <ProfileSkeletonBlock className="h-3 w-24 border-0 bg-[#f4e07b]" />
        </div>
        <div className="grid lg:grid-cols-[240px_minmax(0,1fr)]">
          <div className="flex flex-col items-center gap-4 border-b-2 border-border bg-[#c0f7fe] p-6 lg:border-b-0 lg:border-r-2">
            <ProfileSkeletonBlock className="h-32 w-32 rounded-full bg-white/60" />
            <ProfileSkeletonBlock className="h-4 w-28 border-0 bg-white/60" />
          </div>
          <div className="space-y-6 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1 space-y-3">
                <ProfileSkeletonBlock className="h-10 w-2/3" />
                <ProfileSkeletonBlock className="h-4 w-1/2" />
                <ProfileSkeletonBlock className="h-4 w-3/4" />
              </div>
              <ProfileSkeletonBlock className="h-11 w-32 bg-[#fff4a8]" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="space-y-3 border-2 border-border bg-background px-4 py-3"
                >
                  <ProfileSkeletonBlock className="h-3 w-16 border-0" />
                  <ProfileSkeletonBlock className="h-6 w-24 border-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.9fr)]">
        <div className="grid gap-6">
          <ProfilePanelSkeleton
            eyebrow=""
            title="About Me"
            accentClassName="bg-[#ffd7e5]"
          />
          <MemoriesSkeleton />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1">
          <ProfilePanelSkeleton
            eyebrow="Connections"
            title="Contact Deck"
            accentClassName="bg-[#d6f5df]"
          />
          <ProfilePanelSkeleton
            eyebrow="Campus"
            title="Academic Details"
            accentClassName="bg-[#d9ddff]"
          />
          <ProfilePanelSkeleton
            eyebrow=""
            title="Recent Activity"
            accentClassName="bg-[#c0f7fe]"
          />
          <ProfilePanelSkeleton
            eyebrow=""
            title="Account Controls"
            accentClassName="bg-[#fff1bd]"
          />
        </div>
      </div>
    </div>
  );
}
