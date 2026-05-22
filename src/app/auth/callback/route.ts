import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { createMemoryService } from '@/services/create-memory-service';

/*
 * Handles the Supabase OAuth PKCE callback.
 *
 * After Google OAuth, Supabase redirects here with a `code` query param.
 * This route exchanges the code for a session (server-side), sets the auth
 * cookies, then redirects. If a `post_login_redirect` cookie is present
 * (set by LoginForm before OAuth), it redirects there; otherwise to `/`.
 * If error occurs, it redirects to `/` with the error message.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const supabase = await createClient();
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (error) {
    await supabase.auth.signOut();

    return NextResponse.redirect(
      `${origin}/?auth_error=${encodeURIComponent(errorDescription ?? error)}`
    );
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if the user's account is deactivated and still within the grace period
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (authUser) {
        const prismaUser = await prisma.user.findUnique({
          where: { id: authUser.id },
          select: { accountStatus: true, deactivatedAt: true },
        });

        if (
          prismaUser?.accountStatus === 'DEACTIVATED' &&
          prismaUser.deactivatedAt !== null
        ) {
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

          if (prismaUser.deactivatedAt > thirtyDaysAgo) {
            // Within grace period — restore the account and all its memories
            await prisma.$transaction([
              prisma.user.update({
                where: { id: authUser.id },
                data: { accountStatus: 'ACTIVE', deactivatedAt: null },
              }),
              prisma.memory.updateMany({
                where: { creatorId: authUser.id, deletedAt: { not: null } },
                data: { deletedAt: null },
              }),
            ]);
            return NextResponse.redirect(`${origin}/reactivated`);
          }
        }
      }

      // ── Check for photobooth draft token ──────────────────────────
      // First check URL params (from /photobooth/resume), then fallback to cookie (legacy)
      const cookieStore = await cookies();
      const draftToken =
        searchParams.get('draft_token') ||
        cookieStore.get('photobooth_draft_token')?.value;

      if (draftToken) {
        const isOnboarded = authUser?.app_metadata?.onboarded === true;

        if (isOnboarded && authUser) {
          // User already has an account — submit the draft immediately
          try {
            const draft = await prisma.photoboothDraft.findUnique({
              where: { token: draftToken },
              include: { event: true },
            });

            if (draft && draft.expiresAt > new Date() && !draft.usedAt) {
              const dbUser = await prisma.user.findUnique({
                where: { id: authUser.id, deletedAt: null },
                select: { programBatchId: true },
              });

              if (dbUser) {
                const photoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/memory-media/${draft.photoPath}`;
                const tags = Array.isArray(draft.tags)
                  ? (draft.tags as string[])
                  : [];

                await createMemoryService({
                  title: draft.event.name,
                  description: draft.caption ?? undefined,
                  visibility: 'PUBLIC',
                  locationId: draft.event.locationId,
                  programBatchId: dbUser.programBatchId,
                  tags,
                  mediaURLs: [photoUrl],
                  creatorId: authUser.id,
                  liveEventId: draft.eventId,
                });

                await prisma.photoboothDraft.update({
                  where: { token: draftToken },
                  data: { usedAt: new Date() },
                });
                console.log(
                  `[auth/callback] photobooth draft ${draftToken} submitted successfully`
                );
              } else {
                console.warn(
                  `[auth/callback] user not found in database for draft ${draftToken}`
                );
              }
            } else {
              console.warn(
                `[auth/callback] draft ${draftToken} invalid/expired/already used`
              );
            }
          } catch (err) {
            console.error(
              `[auth/callback] photobooth draft ${draftToken} submission failed:`,
              err
            );
          }

          const res = NextResponse.redirect(
            `${origin}/?photobooth_success=true`
          );
          // Clear legacy cookie if present
          res.cookies.set('photobooth_draft_token', '', {
            maxAge: 0,
            path: '/',
          });
          return res;
        } else {
          // New user — pass token to onboarding; it will submit after account creation
          const res = NextResponse.redirect(
            `${origin}/onboarding?draft_token=${draftToken}`
          );
          // Clear legacy cookie if present
          res.cookies.set('photobooth_draft_token', '', {
            maxAge: 0,
            path: '/',
          });
          return res;
        }
      }

      // Check for a post-login redirect cookie (set by LoginForm)
      const redirectCookie = cookieStore.get('post_login_redirect')?.value;
      const redirect = redirectCookie
        ? decodeURIComponent(redirectCookie)
        : null;

      // Build the redirect response
      const redirectUrl = redirect && redirect.startsWith('/') ? redirect : '/';
      const response = NextResponse.redirect(`${origin}${redirectUrl}`);

      // Clear the cookie if it was present
      if (redirectCookie) {
        response.cookies.set('post_login_redirect', '', {
          maxAge: 0,
          path: '/',
        });
      }

      return response;
    }

    return NextResponse.redirect(
      `${origin}/?auth_error=Failed to exchange code for session`
    );
  }

  return NextResponse.redirect(
    `${origin}/?auth_error=No code or error provided`
  );
}
