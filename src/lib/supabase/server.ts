import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';

/**
 * Especially important if using Fluid compute: Don't put this client in a
 * global variable. Always create a new client within each function when using
 * it.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

/**
 * Server-side Supabase client for route handlers and server components.
 *
 * Browsers authenticate with the session cookie `@supabase/ssr` writes. Native
 * clients have no cookie jar, so the Expo app sends the access token as
 * `Authorization: Bearer <token>` instead and this picks it up. Cookie auth is
 * untouched — the header is only consulted when one is present.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const authorization = (await headers()).get('authorization') ?? undefined;

  return createServerClient(supabaseUrl, supabaseKey, {
    global: authorization
      ? { headers: { Authorization: authorization } }
      : undefined,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have proxy refreshing
          // user sessions.
        }
      },
    },
  });
}
