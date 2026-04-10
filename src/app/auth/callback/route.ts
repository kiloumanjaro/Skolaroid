import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Handles the Supabase OAuth PKCE callback.
 *
 * After Google OAuth, Supabase redirects here with a `code` query param.
 * This route exchanges the code for a session (server-side), sets the auth
 * cookies, then redirects to `/`. The proxy will then enforce onboarding.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirect = searchParams.get('redirect');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // If a redirect param is present, go there; otherwise go home
      // The proxy will handle onboarding enforcement in either case
      if (redirect && redirect.startsWith('/')) {
        return NextResponse.redirect(`${origin}${redirect}`);
      }
      return NextResponse.redirect(`${origin}/`);
    }
  }

  // Code missing or exchange failed
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
