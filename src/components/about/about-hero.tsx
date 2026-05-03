import Link from 'next/link';

type AboutHeroProps = {
  users: number;
  memoryUploads: number;
};

export function AboutHero({ users, memoryUploads }: AboutHeroProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex flex-col items-center gap-0">
        <div className="flex flex-col items-center gap-14 lg:flex-row lg:flex-wrap lg:items-end lg:justify-center">
          <h1 className="text-8xl font-light leading-[0.9] tracking-[-0.05em] text-foreground">
            <span className="font-dancing text-[112px] font-medium text-skolaroid-blue">
              Iskolar
            </span>{' '}
            memories
          </h1>

          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4 self-center text-left">
            <div>
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

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-foreground/60">
                Uploads
              </p>
              <p className="mt-3 text-3xl font-semibold leading-none text-foreground sm:text-4xl">
                {memoryUploads.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-8xl font-normal leading-[0.9] tracking-[-0.05em] text-foreground">
          in digital{' '}
          <span className="font-dancing text-[112px] font-normal text-skolaroid-blue">
            Polaroids
          </span>
        </p>
      </div>

      <Link
        href="/map"
        className="group relative mt-20 inline-flex h-16 w-40 items-center justify-center overflow-hidden border-2 border-border shadow-[4px_4px_0px_0px_#2d2d2d] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#2d2d2d] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
      >
        <span className="absolute left-0 top-0 h-16 w-40 bg-card transition-all group-hover:bg-skolaroid-blue group-active:bg-skolaroid-blue" />
        <span className="relative flex h-16 w-40 items-center justify-center text-center text-lg font-medium text-foreground transition-colors group-hover:text-white group-active:text-white">
          Go to map
        </span>
      </Link>
    </div>
  );
}
