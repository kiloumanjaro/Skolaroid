import Link from 'next/link';

type AboutHeroProps = {
  users: number;
  memoryUploads: number;
};

export function AboutHero({ users, memoryUploads }: AboutHeroProps) {
  return (
    <div className="-mt-8 flex flex-col items-center text-center">
      <div className="flex flex-col items-center gap-0">
        <div className="flex flex-col items-center gap-14 lg:flex-row lg:flex-wrap lg:items-end lg:justify-center">
          <h1 className="text-6xl font-light leading-[0.9] tracking-[-0.05em] text-foreground sm:text-7xl md:text-7xl lg:text-8xl">
            <span className="font-dancing text-[clamp(3.5rem,12vw,7rem)] font-medium text-skolaroid-blue">
              Iskolar
            </span>{' '}
            memories
          </h1>

          {/* Desktop stats — hidden on mobile, shown lg+ in original position */}
          <div className="hidden grid-cols-[1fr_auto_1fr] items-start gap-4 self-center lg:grid">
            <div className="flex flex-col items-center text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-foreground/60">
                Users
              </p>
              <p className="mt-3 text-3xl font-semibold leading-none text-foreground sm:text-4xl">
                {users.toLocaleString()}
              </p>
            </div>

            <div className="self-center text-2xl leading-none text-foreground/40">
              |
            </div>

            <div className="flex flex-col items-center text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-foreground/60">
                Uploads
              </p>
              <p className="mt-3 text-3xl font-semibold leading-none text-foreground sm:text-4xl">
                {memoryUploads.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-6xl font-normal leading-[0.9] tracking-[-0.05em] text-foreground sm:text-7xl md:text-7xl lg:text-8xl">
          in digital{' '}
          <span className="font-dancing text-[clamp(3.5rem,12vw,7rem)] font-normal text-skolaroid-blue">
            Polaroids
          </span>
        </p>
      </div>

      <Link
        href="/map"
        className="group relative mb-16 mt-14 inline-flex h-12 w-32 items-center justify-center overflow-hidden border-2 border-border shadow-[2px_2px_0px_0px_#2d2d2d] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-[1px_1px_0px_0px_#2d2d2d] active:translate-x-2 active:translate-y-2 active:shadow-none sm:h-14 sm:w-36 sm:shadow-[3px_3px_0px_0px_#2d2d2d] sm:hover:translate-x-[2px] sm:hover:translate-y-[2px] sm:hover:shadow-[2px_2px_0px_0px_#2d2d2d] sm:active:translate-x-[3px] sm:active:translate-y-[3px] md:h-14 md:w-36 lg:h-16 lg:w-40 lg:shadow-[4px_4px_0px_0px_#2d2d2d] lg:hover:translate-x-[2px] lg:hover:translate-y-[2px] lg:hover:shadow-[2px_2px_0px_0px_#2d2d2d] lg:active:translate-x-[4px] lg:active:translate-y-[4px]"
      >
        <span className="absolute left-0 top-0 h-12 w-32 bg-card transition-all group-hover:bg-skolaroid-blue group-active:bg-skolaroid-blue sm:h-14 sm:w-36 md:h-14 md:w-36 lg:h-16 lg:w-40" />
        <span className="relative flex h-12 w-32 items-center justify-center text-center text-sm font-medium text-foreground transition-colors group-hover:text-white group-active:text-white sm:h-14 sm:w-36 sm:text-base md:h-14 md:w-36 md:text-base lg:h-16 lg:w-40 lg:text-lg">
          Go to map
        </span>
      </Link>
    </div>
  );
}
