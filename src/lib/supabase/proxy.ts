import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

/**
 * Refreshes the Supabase session and syncs cookies.
 * Purely Supabase session management — no app logic here.
 *
 * Always create a new client per request (required for Fluid compute).
 */
export async function refreshSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Do not add code between createServerClient and getUser.
  let user = null;

  try {
    const { data, error } = await supabase.auth.getUser();

    // Missing/invalid refresh tokens are expected for unauthenticated users.
    // Treat auth refresh failures as anonymous requests instead of throwing.
    if (!error) {
      user = data.user;
    }
  } catch {
    user = null;
  }

  return { user, supabaseResponse };
}
