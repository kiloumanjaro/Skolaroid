import Link from 'next/link';
import {
  ArrowRight,
  Camera,
  Heart,
  Images,
  MapPin,
  Sparkles,
  Tag,
  Users,
} from 'lucide-react';
import { Header } from '@/components/header';

const pillars = [
  {
    icon: MapPin,
    title: 'Memories live in real places',
    description:
      'Every post is tied to a campus landmark, so stories stay connected to the halls, corners, and buildings where they happened.',
    accent: 'bg-sky-100 text-sky-700',
  },
  {
    icon: Camera,
    title: 'Photos feel like keepsakes',
    description:
      'Skolaroid turns everyday uploads into something more personal: a visual keepsake that feels handwritten, shared, and worth revisiting.',
    accent: 'bg-amber-100 text-amber-700',
  },
  {
    icon: Tag,
    title: 'Tags make stories discoverable',
    description:
      'Moments can be grouped by batch, theme, event, or feeling, making it easy to browse memories from every era of campus life.',
    accent: 'bg-emerald-100 text-emerald-700',
  },
  {
    icon: Users,
    title: 'Community gives the archive life',
    description:
      'What starts as one memory becomes a shared timeline when classmates, alumni, and friends add their own perspectives.',
    accent: 'bg-rose-100 text-rose-700',
  },
];

const journey = [
  {
    step: '01',
    title: 'Capture a moment',
    description:
      'Upload a photo that means something, whether it is a quiet in-between memory or a major milestone.',
  },
  {
    step: '02',
    title: 'Pin it to campus',
    description:
      'Place that memory on the map so it stays anchored to the exact location where it belongs.',
  },
  {
    step: '03',
    title: 'Let others find it',
    description:
      'Tags, eras, and the gallery view help the memory become part of a bigger story that others can explore.',
  },
];

const creators = [
  'Kint Louise Borbano',
  'Larissa Soronio',
  'Norman Jazul',
  'Christian James Bayadog',
  'Jhon Carlo Sandro',
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="relative overflow-hidden pt-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-8rem] top-10 h-64 w-64 rounded-full bg-sky-200/35 blur-3xl" />
          <div className="absolute right-[-6rem] top-40 h-72 w-72 rounded-full bg-amber-200/35 blur-3xl" />
          <div className="absolute bottom-10 left-1/3 h-56 w-56 rounded-full bg-emerald-200/25 blur-3xl" />
        </div>

        <section className="relative mx-auto grid w-full max-w-7xl gap-12 px-6 py-14 md:px-10 lg:grid-cols-[1.15fr_0.85fr] lg:px-16 lg:py-20">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 border-2 border-border bg-card px-4 py-2 text-sm font-semibold shadow-[4px_4px_0px_0px_#2d2d2d]">
              <Sparkles className="h-4 w-4 text-skolaroid-blue" />A living
              campus scrapbook
            </div>

            <h1 className="max-w-3xl text-5xl leading-[0.95] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              About{' '}
              <span className="font-dancing text-skolaroid-blue">
                Skolaroid
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
              Skolaroid is a place-based memory archive for campus life. It
              helps students, alumni, and communities turn photos into stories
              that stay attached to the buildings, eras, and shared moments that
              shaped them.
            </p>

            <p className="mt-5 max-w-2xl text-base leading-7 text-foreground/80 sm:text-lg">
              The point is not just to store images. It is to remember where a
              moment happened, who it belonged to, and how it fits into the
              bigger timeline of a school community.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/map"
                className="inline-flex items-center justify-center gap-2 border-2 border-border bg-skolaroid-blue px-6 py-3 text-base font-semibold text-white shadow-[4px_4px_0px_0px_#2d2d2d] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#2d2d2d]"
              >
                Explore the map
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/gallery"
                className="inline-flex items-center justify-center gap-2 border-2 border-border bg-card px-6 py-3 text-base font-semibold text-foreground shadow-[4px_4px_0px_0px_#2d2d2d] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-secondary hover:shadow-[2px_2px_0px_0px_#2d2d2d]"
              >
                Browse the gallery
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="border-2 border-border bg-card px-5 py-4 shadow-[4px_4px_0px_0px_#2d2d2d]">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-skolaroid-blue">
                  Place
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Stories stay grounded in real campus landmarks.
                </p>
              </div>

              <div className="border-2 border-border bg-card px-5 py-4 shadow-[4px_4px_0px_0px_#2d2d2d]">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-skolaroid-blue">
                  Era
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Batches and decades become easier to revisit together.
                </p>
              </div>

              <div className="border-2 border-border bg-card px-5 py-4 shadow-[4px_4px_0px_0px_#2d2d2d]">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-skolaroid-blue">
                  Belonging
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  A shared archive grows richer every time someone contributes.
                </p>
              </div>
            </div>
          </div>

          <div className="relative mx-auto flex w-full max-w-xl items-center justify-center">
            <div className="absolute left-2 top-10 hidden h-40 w-40 rounded-full bg-postit/60 blur-2xl sm:block" />

            <div className="relative w-full max-w-md">
              <div className="absolute -left-4 top-6 h-full w-full rotate-[-5deg] border-2 border-border bg-card/80 shadow-[4px_4px_0px_0px_#2d2d2d]" />
              <div className="absolute right-[-1rem] top-16 h-full w-full rotate-[6deg] border-2 border-border bg-[#fff5dd] shadow-[4px_4px_0px_0px_#2d2d2d]" />

              <div className="relative overflow-hidden border-2 border-border bg-card p-5 shadow-[8px_8px_0px_0px_#2d2d2d]">
                <div className="h-56 rounded-sm border-2 border-border bg-[linear-gradient(135deg,#dbeafe_0%,#fef3c7_52%,#dcfce7_100%)] p-5">
                  <div className="flex h-full flex-col justify-between rounded-sm border border-dashed border-border/30 bg-white/40 p-4 backdrop-blur-[1px]">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.24em] text-foreground/60">
                      <span>Skolaroid snapshot</span>
                      <span>Campus memory</span>
                    </div>

                    <div>
                      <p className="font-dancing text-4xl leading-none text-skolaroid-blue">
                        every hallway
                      </p>
                      <p className="mt-2 text-xl leading-tight text-foreground">
                        can hold a story worth keeping.
                      </p>
                    </div>

                    <div className="grid gap-2 text-sm text-foreground/75">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-skolaroid-blue" />
                        Linked to a real campus location
                      </div>
                      <div className="flex items-center gap-2">
                        <Images className="h-4 w-4 text-skolaroid-blue" />
                        Browse by era, gallery, or map
                      </div>
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-skolaroid-blue" />
                        Built for shared remembrance
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rotate-[-2deg] border-2 border-border bg-[#fff9c4] p-4 shadow-[3px_3px_0px_0px_#2d2d2d]">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/60">
                      Why it matters
                    </p>
                    <p className="mt-2 text-base leading-6 text-foreground">
                      Campus culture can disappear fast when memories stay
                      buried in private camera rolls.
                    </p>
                  </div>

                  <div className="rotate-[2deg] border-2 border-border bg-[#e0f2fe] p-4 shadow-[3px_3px_0px_0px_#2d2d2d]">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/60">
                      What Skolaroid does
                    </p>
                    <p className="mt-2 text-base leading-6 text-foreground">
                      It gives those memories a place, a timeline, and a
                      community to return to.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative mx-auto w-full max-w-7xl px-6 py-6 md:px-10 lg:px-16 lg:py-10">
          <div className="mb-8 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-skolaroid-blue">
              What makes it feel like Skolaroid
            </p>
            <h2 className="mt-3 text-3xl leading-tight text-foreground sm:text-4xl">
              More than a gallery, more personal than a feed
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {pillars.map(({ icon: Icon, title, description, accent }) => (
              <article
                key={title}
                className="border-2 border-border bg-card p-6 shadow-[5px_5px_0px_0px_#2d2d2d]"
              >
                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${accent}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl leading-tight text-foreground">
                  {title}
                </h3>
                <p className="mt-3 text-base leading-7 text-muted-foreground">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 py-10 md:px-10 lg:px-16 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="border-2 border-border bg-[#fffaf1] p-7 shadow-[6px_6px_0px_0px_#2d2d2d]">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-skolaroid-blue">
                The idea
              </p>
              <h2 className="mt-3 text-3xl leading-tight text-foreground">
                A school is made of places, but also the stories left inside
                them.
              </h2>
              <p className="mt-5 text-lg leading-8 text-foreground/80">
                Skolaroid is designed to make memory-keeping feel communal. The
                map helps people rediscover where something happened. The
                gallery helps them browse moods and eras. The tags help them
                connect scattered moments into a larger history.
              </p>
            </div>

            <div className="grid gap-4">
              {journey.map(({ step, title, description }) => (
                <div
                  key={step}
                  className="flex gap-4 border-2 border-border bg-card p-5 shadow-[5px_5px_0px_0px_#2d2d2d]"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-skolaroid-blue text-lg font-semibold text-white">
                    {step}
                  </div>
                  <div>
                    <h3 className="text-2xl leading-tight text-foreground">
                      {title}
                    </h3>
                    <p className="mt-2 text-base leading-7 text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 pb-16 md:px-10 lg:px-16 lg:pb-20">
          <div className="border-2 border-border bg-card px-6 py-8 shadow-[8px_8px_0px_0px_#2d2d2d] sm:px-8 sm:py-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="font-dancing text-4xl leading-none text-skolaroid-blue sm:text-5xl">
                  keep the campus alive
                </p>
                <p className="mt-4 text-lg leading-8 text-foreground/80">
                  From first-day jitters to graduation photos, Skolaroid exists
                  to keep a school&apos;s emotional history visible, searchable,
                  and shareable across generations.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center border-2 border-border bg-card px-6 py-3 text-base font-semibold text-foreground shadow-[4px_4px_0px_0px_#2d2d2d] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-secondary hover:shadow-[2px_2px_0px_0px_#2d2d2d]"
                >
                  Start exploring
                </Link>
                <a
                  href="https://github.com/kiloumanjaro/Skolaroid"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center border-2 border-border bg-[#eff6ff] px-6 py-3 text-base font-semibold text-foreground shadow-[4px_4px_0px_0px_#2d2d2d] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[#dbeafe] hover:shadow-[2px_2px_0px_0px_#2d2d2d]"
                >
                  View on GitHub
                </a>
              </div>
            </div>
          </div>
        </section>

        <footer className="w-full pb-0">
          <div className="overflow-hidden border-y-2 border-black bg-[#e1d94e]">
            <div
              className="about-creators-marquee"
              aria-label="Creators of this website"
            >
              {[0, 1].map((group) => (
                <div
                  key={group}
                  className="about-creators-marquee-group"
                  aria-hidden={group === 1}
                >
                  {creators.map((creator) => (
                    <div
                      key={`${group}-${creator}`}
                      className="flex shrink-0 items-center gap-6 px-6 text-base font-semibold tracking-[0.16em] text-black sm:text-lg"
                    >
                      <span>{creator}</span>
                      <span className="text-black/70">/</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

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
    </main>
  );
}
