import Image from 'next/image';

type TeamMember = {
  name: string;
  role: string;
  image?: string;
};

type AboutTeamProps = {
  teamMembers: TeamMember[];
};

export function AboutTeam({ teamMembers }: AboutTeamProps) {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10 pb-16 md:px-10 lg:px-16 lg:py-14 lg:pb-20">
      <div className="mb-16 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-foreground/70">
          The people behind Skolaroid
        </p>
        <h2 className="mt-5">
          <span className="inline-block rounded-lg border-2 border-[#2d2d2d] bg-[#f6cb48] px-4 py-2 text-2xl font-bold uppercase tracking-wider text-[#2d2d2d] shadow-[3px_3px_0_0_#2d2d2d] sm:text-4xl">
            team goat
          </span>
        </h2>
        <p className="mt-4 text-base leading-relaxed text-foreground/75 sm:text-lg">
          A small team shaping a softer, place-based archive for campus memories
          and the people who keep them alive.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
        {teamMembers.map((member) => (
          <article
            key={member.name}
            className="flex min-h-[220px] flex-col justify-between rounded-[2rem] border-2 border-[#2d2d2d] bg-white p-6 shadow-[0_10px_0_0_#2d2d2d]"
          >
            <div className="space-y-4">
              <div className="relative aspect-square w-full overflow-hidden rounded-lg border-2 border-[#2d2d2d] bg-gray-300">
                {member.image && (
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div>
                <h3 className="text-2xl leading-tight text-foreground">
                  {member.name}
                </h3>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-foreground/65">
                  {member.role}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
