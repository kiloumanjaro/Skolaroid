import Image from 'next/image';

type TeamMember = {
  name: string;
  role: string;
  image?: string;
  linkedIn?: string;
};

type AboutTeamProps = {
  teamMembers: TeamMember[];
};

export function AboutTeam({ teamMembers }: AboutTeamProps) {
  return (
    <div className="py-10 pb-16 lg:py-14 lg:pb-20">
      <div className="mx-auto mb-16 w-full max-w-7xl px-6 md:px-10 lg:px-16">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-foreground/70">
            The people behind Skolaroid
          </p>
          <h2 className="mt-5">
            <span className="inline-block rounded-none border-2 border-[#2d2d2d] bg-[#f6cb48] px-4 py-2 text-2xl font-bold uppercase tracking-wider text-[#2d2d2d] sm:text-4xl">
              team goat
            </span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-foreground/75 sm:text-lg">
            A small team shaping a softer, place-based archive for campus
            memories and the people who keep them alive.
          </p>
        </div>
      </div>

      <div className="scrollbar-hide flex flex-row gap-5 overflow-x-auto px-6 pb-1 lg:mx-auto lg:grid lg:max-w-7xl lg:grid-cols-5 lg:overflow-visible lg:px-16">
        {teamMembers.map((member) => (
          <a
            key={member.name}
            href={member.linkedIn || '#'}
            target={member.linkedIn ? '_blank' : undefined}
            rel={member.linkedIn ? 'noopener noreferrer' : undefined}
            className="flex w-64 flex-shrink-0 flex-col justify-between rounded-none border-2 border-[#2d2d2d] bg-white p-6 transition-opacity hover:opacity-75 lg:w-auto"
          >
            <div className="space-y-4">
              <div className="relative aspect-square w-full overflow-hidden rounded-none border-2 border-[#2d2d2d] bg-gray-300">
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
          </a>
        ))}
      </div>
    </div>
  );
}
