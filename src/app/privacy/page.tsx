import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Skolaroid',
  description: 'How Skolaroid collects, uses, and protects your information.',
};

/**
 * Public privacy policy. Static content only — no auth, no data fetching —
 * so it stays reachable for signed-out visitors (required by Google OAuth
 * verification and the app stores). Listed in PUBLIC_ROUTES in src/proxy.ts.
 */
export default function PrivacyPolicyPage() {
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
          <h1 className="mt-6 text-4xl text-foreground">Privacy Policy</h1>
          <p className="mt-2 text-sm font-semibold uppercase tracking-widest text-foreground/60">
            Last updated: 3 October 2026
          </p>
        </header>

        <div className="space-y-10 text-lg leading-relaxed text-foreground/90">
          <section>
            <h2 className="mb-3 text-2xl text-foreground">Who we are</h2>
            <p>
              Skolaroid is a campus memory app: people at a school pin photos
              and short stories to places on their campus map. This page
              explains what information the app collects, how it is used, and
              the choices you have.
            </p>
            <p className="mt-3">
              Skolaroid is operated by [OPERATOR LEGAL NAME, COUNTRY]. If you
              have a question or request about your data, email{' '}
              <a
                href="mailto:kiloumanjaro@gmail.com"
                className="underline decoration-skolaroid-blue decoration-2 underline-offset-4"
              >
                kiloumanjaro@gmail.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl text-foreground">What we collect</h2>
            <p>
              <strong>Your account.</strong> Your email address, and a password
              or a Google sign-in. If you sign in with Google, we receive your
              name, email address and profile picture — nothing else.
            </p>
            <p className="mt-3">
              <strong>Your profile.</strong> What you type in: first and last
              name, student ID (optional), program, batch year, whether you are
              a student or alumni, and optionally a bio, phone number, and links
              to LinkedIn, Facebook or another page.
            </p>
            <p className="mt-3">
              <strong>Your school.</strong> The school you belong to, decided by
              your email domain or picked by you, and a school email address if
              you confirm one later.
            </p>
            <p className="mt-3">
              <strong>What you post.</strong> Memories (title, description,
              date, tags, visibility), photos and videos, comments, votes, the
              groups you create or join, and reports you file.
            </p>
            <p className="mt-3">
              <strong>Places.</strong> Pins you add to the campus map (a name
              and coordinates). Your phone&apos;s location is asked for once,
              during sign-up, only if you are the first person from your school
              and choose to use it to place the campus on the map. We do not
              track your location and do not store where you are.
            </p>
            <p className="mt-3">
              <strong>Device permissions.</strong> Camera and microphone to take
              photos and videos in the app, photo library to choose and save
              them, and location as described above.
            </p>
            <p className="mt-3">
              <strong>Purchases.</strong> If you buy tokens, the app store
              handles payment. We receive that a purchase happened and which
              pack — not your card details.
            </p>
            <p className="mt-3">
              <strong>Moderation records.</strong> Reports, moderator decisions,
              and suspensions.
            </p>
            <p className="mt-3">
              We do not use advertising or analytics trackers, and we do not
              sell your data.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl text-foreground">
              How photos and videos are handled
            </h2>
            <p>
              Location and other hidden data (EXIF) are removed from photos and
              videos when they are uploaded. Media is stored privately, and the
              app shows it through links that expire after 24 hours.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl text-foreground">Who can see what</h2>
            <p>
              Public memories are visible to members of your own school only,
              after a moderator approves them. Nothing is shown to other schools
              or to people who are not signed in.
            </p>
            <p className="mt-3">
              Group memories are visible only to that group&apos;s members.
              Private memories are visible only to you.
            </p>
            <p className="mt-3">
              Your school&apos;s moderators can see reported content, content
              awaiting review, and your moderation history. Platform
              administrators can do the same across schools for support.
            </p>
            <p className="mt-3">
              Other members see your name and profile picture. Your email
              address is shown only to people who manage a group you are in.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl text-foreground">
              Who we share data with
            </h2>
            <p>
              We share data only with the service providers that run the app:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <strong>Supabase</strong> — database, sign-in and file storage,
                hosted in Singapore.
              </li>
              <li>
                <strong>Railway</strong> — runs the app&apos;s server.
              </li>
              <li>
                <strong>Google</strong> — only if you choose to sign in with
                Google.
              </li>
              <li>
                <strong>Mapbox</strong> — draws the map; it receives map
                requests from your device.
              </li>
              <li>
                <strong>RevenueCat, Apple and Google Play</strong> — process
                token purchases.
              </li>
              <li>
                <strong>Resend</strong> — sends invitation and confirmation
                emails.
              </li>
              <li>
                <strong>Expo</strong> — delivers app builds and updates.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl text-foreground">
              How long we keep it
            </h2>
            <p>
              You can delete your account in the app (Profile → Delete account).
              Your memories and comments are taken down immediately. Their
              photos are kept for 30 days in case a moderator needs them —
              longer while a report about them is open — and then deleted.
            </p>
            <p className="mt-3">
              Your account row is kept with your name, email and profile details
              removed, because moderation records refer to it.
            </p>
            <p className="mt-3">
              A memory you delete yourself is handled the same way: hidden at
              once, files removed after 30 days.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl text-foreground">Your choices</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>Edit your profile in the app.</li>
              <li>Change who can see a memory, or delete it.</li>
              <li>Leave a group. Delete your account.</li>
              <li>
                Ask for a copy of your data, or for something to be corrected or
                removed, by emailing{' '}
                <a
                  href="mailto:kiloumanjaro@gmail.com"
                  className="underline decoration-skolaroid-blue decoration-2 underline-offset-4"
                >
                  kiloumanjaro@gmail.com
                </a>
                .
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl text-foreground">Age</h2>
            <p>
              Skolaroid is for university and college students and alumni. The
              minimum age to use it is [MINIMUM AGE].
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl text-foreground">Law and changes</h2>
            <p>[GOVERNING PRIVACY LAW AND REGULATOR TO BE CONFIRMED]</p>
            <p className="mt-3">
              We will update this page when the policy changes and change the
              date at the top.
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
              href="/terms"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Terms of Use
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
