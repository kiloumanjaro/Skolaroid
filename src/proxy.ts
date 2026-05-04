import { NextResponse, type NextRequest } from 'next/server';
import { refreshSession } from '@/lib/supabase/proxy';

/** Routes accessible without authentication. */
const PUBLIC_ROUTES = [
  '/',
  '/auth/callback',
  '/invite',
  '/swagger',
  '/api/swagger',
];

/** Routes accessible to authenticated-but-not-onboarded users. */
const ONBOARDING_ROUTES = [
  '/onboarding',
  '/api/prisma/user/create',
  '/api/prisma/user/delete',
];

function matchesRoute(pathname: string, routes: string[]) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );
}

/**
 * Next.js proxy handler (replaces the old middleware.ts).
 * 1. Refreshes Supabase session (cookie sync).
 * 2. Enforces authentication and onboarding guards.
 *
 * Flow:
 * - Not authenticated → only allow public routes, redirect to `/` otherwise.
 * - Authenticated but not onboarded → force to `/onboarding`.
 * - Authenticated and onboarded → allow all routes, block `/onboarding`.
 */
export async function proxy(request: NextRequest) {
  // Step 1: Refresh session and sync cookies
  const { user, supabaseResponse } = await refreshSession(request);

  const pathname = request.nextUrl.pathname;

  // Step 2: Not authenticated → only allow public routes
  if (!user && !matchesRoute(pathname, PUBLIC_ROUTES)) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  if (user) {
    const isOnboarded = user.app_metadata?.onboarded === true;
    // Step 3: Authenticated but NOT onboarded → force to /onboarding
    // Preserve redirect param so /invite?token=... survives onboarding
    if (!isOnboarded && !matchesRoute(pathname, ONBOARDING_ROUTES)) {
      const url = request.nextUrl.clone();
      const redirect = request.nextUrl.searchParams.get('redirect');
      url.pathname = '/onboarding';
      // If currently on /invite, or there's an existing redirect param, preserve it
      if (pathname.startsWith('/invite')) {
        url.searchParams.set(
          'redirect',
          `${pathname}${request.nextUrl.search}`
        );
      } else if (redirect) {
        url.searchParams.set('redirect', redirect);
      }
      return NextResponse.redirect(url);
    }

    // Step 4: Authenticated AND onboarded → block /onboarding
    if (isOnboarded && matchesRoute(pathname, ONBOARDING_ROUTES)) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  // Step 5: No redirect needed, continue with updated cookies
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
