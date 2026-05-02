import Link from 'next/link';

type AboutHeroProps = {
  users: number;
  memoryUploads: number;
};

export function AboutHero({ users, memoryUploads }: AboutHeroProps) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex flex-col items-center gap-14 lg:flex-row lg:flex-wrap lg:items-end lg:justify-center">
        <h1 className="text-9xl font-light leading-[0.9] tracking-[-0.05em] text-foreground">
          <span className="font-dancing text-[150px] font-medium text-skolaroid-blue">
            Iskolar
          </span>{' '}
          memories
        </h1>

        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4 self-center text-left">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-foreground/60">
              Users
            </p>
            <p className="mt-3 text-4xl font-semibold leading-none text-foreground sm:text-5xl">
              {users.toLocaleString()}
            </p>
          </div>

          <div className="self-center text-3xl leading-none text-foreground/40">
            |
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-foreground/60">
              Uploads
            </p>
            <p className="mt-3 text-4xl font-semibold leading-none text-foreground sm:text-5xl">
              {memoryUploads.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-center sm:gap-8">
        <Link
          href="/map"
          className="inline-flex items-center justify-center border-2 border-border bg-[#c3f61d] px-6 py-3 text-base font-semibold uppercase text-black transition-all"
        >
          Go to map
        </Link>

        <p className="text-9xl font-normal leading-[0.9] tracking-[-0.05em] text-foreground">
          in digital{' '}
          <span className="font-dancing text-[150px] font-normal text-skolaroid-blue">
            Polaroids
          </span>
        </p>
      </div>
    </div>
  );
}
