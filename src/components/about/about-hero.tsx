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
        className="mt-20 inline-flex items-center justify-center border-2 border-border bg-[#c3f61d] px-10 py-4 text-base font-semibold uppercase tracking-[0.08em] text-black transition-all hover:scale-[1.02]"
      >
        Go to map
      </Link>
    </div>
  );
}
