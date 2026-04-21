import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
// Needed to check and restore deactivated accounts on login
import { prisma } from '@/lib/prisma';

/**
 * Handles the Supabase OAuth PKCE callback.
 *
 * After Google OAuth, Supabase redirects here with a `code` query param.
 * This route exchanges the code for a session (server-side), sets the auth
 * cookies, then redirects. If a `post_login_redirect` cookie is present
 * (set by LoginForm before OAuth), it redirects there; otherwise to `/`.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
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

      // Check for a post-login redirect cookie (set by LoginForm)
      const cookieStore = await cookies();
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
  }

  // Code missing or exchange failed
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
