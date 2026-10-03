import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Use | Skolaroid',
  description: 'The rules for using Skolaroid.',
};

/**
 * Public terms of use. Static content only — no auth, no data fetching —
 * so it stays reachable for signed-out visitors. Listed in PUBLIC_ROUTES
 * in src/proxy.ts.
 */
export default function TermsPage() {
  return (
    <div className="min-h-dvh bg-[#fcf5ef]">
      <main className="mx-auto w-full max-w-3xl px-6 py-12 sm:py-16">
        <header className="mb-10">
          <Link
            href="/"
            className="font-dancing text-3xl font-bold text-skolaroid-blue"
          >
            Skolaroid
          </Link>
          <h1 className="mt-6 text-4xl text-foreground">Terms of Use</h1>
          <p className="mt-2 text-sm font-semibold uppercase tracking-widest text-foreground/60">
            Last updated: 3 October 2026
          </p>
        </header>

        <div className="space-y-10 text-lg leading-relaxed text-foreground/90">
          <section>
            <h2 className="mb-3 text-2xl text-foreground">Who may use it</h2>
            <p>
              Skolaroid is for university and college students and alumni. You
              need an account tied to your school to take part.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl text-foreground">What you post</h2>
            <p>
              You are responsible for what you post. You must have the right to
              post what you share — including photos of other people.
            </p>
            <p className="mt-3">The following is not allowed:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Harassment</li>
              <li>Hate speech</li>
              <li>Sexual content</li>
              <li>Other people&apos;s private information</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl text-foreground">Moderation</h2>
            <p>
              Moderators may remove content and suspend accounts. If your
              content is removed, you can appeal the removal in the app.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl text-foreground">Tokens</h2>
            <p>
              Tokens are not refundable, except where the Apple App Store or
              Google Play require a refund.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl text-foreground">
              Liability and governing law
            </h2>
            <p>[LIABILITY TERMS TO BE CONFIRMED]</p>
            <p className="mt-3">[GOVERNING LAW TO BE CONFIRMED]</p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl text-foreground">Contact</h2>
            <p>
              Questions about these terms:{' '}
              <a
                href="mailto:kiloumanjaro@gmail.com"
                className="underline decoration-skolaroid-blue decoration-2 underline-offset-4"
              >
                kiloumanjaro@gmail.com
              </a>
            </p>
          </section>
        </div>

        <footer className="mt-14 border-t-2 border-foreground/10 pt-6 text-sm text-foreground/60">
          <p>
            © 2026 Skolaroid ·{' '}
            <Link
              href="/"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Home
            </Link>{' '}
            ·{' '}
            <Link
              href="/privacy"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Privacy Policy
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
