import {
  AboutWorkflowCard,
  type AboutWorkflowCardProps,
} from '@/components/about/about-workflow-card';
import { AboutHero } from '@/components/about/about-hero';
import { AboutAnnouncementStrip } from '@/components/announcement-strips/AboutAnnouncementStrip';
import { AboutCreatorsMarquee } from '@/components/about-creators-marquee';
import { ShellInlineSidebarToggle } from '@/components/shell-inline-sidebar-toggle';
import { ShellBatchesSidebarAction } from '@/components/shell-batches-sidebar-action';
import { prisma } from '@/lib/prisma';

const pillars: AboutWorkflowCardProps[] = [
  {
    eyebrow: 'How Skolaroid Works',
    date: 'Step 01',
    title: 'PIN THE MEMORY TO A REAL PLACE',
    description:
      'Every post begins with a real campus location, so the story stays attached to the building, hallway, or landmark where it happened.',
    bannerColor: '#c78ae6',
  },
  {
    eyebrow: 'How Skolaroid Works',
    date: 'Step 02',
    title: 'ADD THE PHOTO AND TELL THE STORY',
    description:
      'Upload a photo, add context, and turn a quick snapshot into something more meaningful than a post that disappears in a feed.',
    bannerColor: '#90a8ee',
  },
  {
    eyebrow: 'How Skolaroid Works',
    date: 'Step 03',
    title: 'BROWSE THE ARCHIVE BY PLACE OR ERA',
    description:
      'Once shared, memories become part of a place-based collection that people can revisit through landmarks, timelines, and campus moments.',
    bannerColor: '#f6cb48',
  },
];

const teamMembers = [
  {
    name: 'Kint Louise Borbano',
    role: 'Creative Direction',
  },
  {
    name: 'Larissa Soronio',
    role: 'Community Storytelling',
  },
  {
    name: 'Norman Jazul',
    role: 'Experience Design',
  },
  {
    name: 'Christian James Bayadog',
    role: 'Product Development',
  },
  {
    name: 'Jhon Carlo Sandro',
    role: 'Platform Engineering',
  },
];

const creators = teamMembers.map((member) => member.name);

const aboutAnnouncements = [
  'Pinned memories built around real campus places',
  'Photos, tags, and eras woven into one shared archive',
  'A softer space for stories that should not disappear',
];

export default async function AboutPage() {
  const users = await prisma.user.count({
    where: {
      deletedAt: null,
    },
  });

  const memoryUploads = await prisma.memory.count({
    where: {
      deletedAt: null,
    },
  });

  return (
    <div className="scrollbar-hide h-full overflow-y-auto bg-background">
      <ShellBatchesSidebarAction />

      <div className="relative overflow-hidden">
        <div className="absolute left-4 top-12 z-20 sm:left-6 sm:top-14">
          <ShellInlineSidebarToggle />
        </div>

        <AboutAnnouncementStrip announcements={aboutAnnouncements} />

        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-8rem] top-10 h-64 w-64 rounded-full bg-sky-200/35 blur-3xl" />
          <div className="absolute right-[-6rem] top-40 h-72 w-72 rounded-full bg-amber-200/35 blur-3xl" />
          <div className="absolute bottom-10 left-1/3 h-56 w-56 rounded-full bg-emerald-200/25 blur-3xl" />
        </div>

        <section className="relative z-10">
          <div className="bg-[#fcf5ef]">
            <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-14 md:px-10 lg:px-16 lg:py-20">
              <AboutHero users={users} memoryUploads={memoryUploads} />
            </div>
          </div>

          <svg
            viewBox="0 0 1440 64"
            preserveAspectRatio="none"
            className="-mt-px block h-16 w-full"
            aria-hidden="true"
          >
            <path
              d="M0,0 H1440 V40 C1320,52 1200,52 1080,40 C960,28 840,28 720,40 C600,52 480,52 360,40 C240,28 120,28 0,40 Z"
              fill="#fcf5ef"
            />
            <path
              d="M0,40 C120,28 240,28 360,40 C480,52 600,52 720,40 C840,28 960,28 1080,40 C1200,52 1320,52 1440,40"
              stroke="#2d2d2d"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </section>

        <section className="relative z-0 -mt-10 bg-[#00c59a] pt-10">
          <div className="mx-auto w-full max-w-7xl px-6 py-10 md:px-10 lg:px-16 lg:py-14">
            <div className="mb-8 max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-foreground/70">
                What makes it feel like Skolaroid
              </p>
              <h2 className="mt-3 text-3xl leading-tight text-foreground sm:text-4xl">
                how skolaroid works..
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {pillars.map((pillar) => (
                <AboutWorkflowCard key={pillar.title} {...pillar} />
              ))}
            </div>
          </div>
        </section>

        <section className="relative z-10">
          <svg
            viewBox="0 0 1440 64"
            preserveAspectRatio="none"
            className="-mt-px block h-16 w-full"
            aria-hidden="true"
          >
            <path
              d="M0,0 H1440 V40 C1320,52 1200,52 1080,40 C960,28 840,28 720,40 C600,52 480,52 360,40 C240,28 120,28 0,40 Z"
              fill="#00c59a"
            />
            <path
              d="M0,40 C120,28 240,28 360,40 C480,52 600,52 720,40 C840,28 960,28 1080,40 C1200,52 1320,52 1440,40"
              stroke="#2d2d2d"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </section>

        <section className="relative z-0 -mt-10 bg-[#e9c9f0] pt-10">
          <div className="mx-auto w-full max-w-7xl px-6 py-10 pb-16 md:px-10 lg:px-16 lg:py-14 lg:pb-20">
            <div className="mb-8 max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-foreground/70">
                The people behind Skolaroid
              </p>
              <h2 className="mt-3 text-3xl leading-tight text-foreground sm:text-4xl">
                meet our team.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground/75 sm:text-lg">
                A small team shaping a softer, place-based archive for campus
                memories and the people who keep them alive.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
              {teamMembers.map((member) => (
                <article
                  key={member.name}
                  className="flex min-h-[220px] flex-col justify-between rounded-[2rem] border-2 border-[#2d2d2d] bg-[#fcf5ef] p-6 shadow-[0_10px_0_0_#2d2d2d]"
                >
                  <div className="space-y-4">
                    <span className="inline-flex rounded-full border-2 border-[#2d2d2d] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-foreground/70">
                      Team member
                    </span>
                    <div>
                      <h3 className="text-2xl leading-tight text-foreground">
                        {member.name}
                      </h3>
                      <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-foreground/65">
                        {member.role}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 h-3 w-full rounded-full border-2 border-[#2d2d2d] bg-[#e9c9f0]" />
                </article>
              ))}
            </div>
          </div>
        </section>

        <footer className="w-full pb-0">
          <AboutCreatorsMarquee creators={creators} />

          <div className="flex min-h-[200px] items-center justify-center bg-white px-6 py-10 text-center">
            <p className="max-w-5xl text-base leading-relaxed text-black sm:text-lg">
              Studio Folly would like to acknowledge the Traditional Aboriginal
              Owners and Custodians of the stolen land on which the team live
              and work, and pay our respects to their elders past, present and
              emerging. As Studio Folly is founded in Naarm, we want to
              specifically acknowledge the Wurundjeri People of the Kulin
              Nation. Sovereignty was never ceded. Always was, always will be.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
