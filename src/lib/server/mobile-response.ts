import { NextResponse } from 'next/server';

/**
 * Helpers for the `/api/mobile/*` routes.
 *
 * These responses are per-user and must never be cached by a CDN or an
 * intermediate proxy, so every one of them is sent `private, no-store`. The
 * app does its own caching in React Query, where it can be invalidated.
 */
const NO_STORE = {
  'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
} as const;

export function mobileJson<T>(body: T, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

export function mobileError(message: string, status: number): NextResponse {
  return mobileJson({ success: false, message }, status);
}
