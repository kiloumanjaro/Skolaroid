import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /photobooth/resume?token=<draft_token>
 *
 * Called when a visitor scans the photobooth QR code on their phone.
 * Validates the draft token, sets a short-lived cookie, then sends
 * the user to the home page where they can sign in.
 * After OAuth completes, auth/callback reads the cookie and auto-submits the draft.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(`${origin}/?photobooth_error=missing_token`);
  }

  const draft = await prisma.photoboothDraft.findUnique({
    where: { token },
    select: { expiresAt: true, usedAt: true },
  });

  if (!draft || draft.expiresAt < new Date() || draft.usedAt !== null) {
    return NextResponse.redirect(`${origin}/?photobooth_error=invalid_token`);
  }

  const response = NextResponse.redirect(`${origin}/`);
  response.cookies.set('photobooth_draft_token', token, {
    maxAge: 30 * 60,
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
  });

  return response;
}
