import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

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

    return NextResponse.redirect(
      `${origin}/?auth_error=Failed to exchange code for session`
    );
  }

  return NextResponse.redirect(
    `${origin}/?auth_error=No code or error provided`
  );
}
