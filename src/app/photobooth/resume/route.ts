import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /photobooth/resume?token=<draft_token>
 *
 * Called when a visitor scans the photobooth QR code on their phone.
 * Validates the draft token, then redirects to the login page with the token in the URL.
 * After OAuth completes, auth/callback checks for the draft token and auto-submits it.
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

  // Pass the draft token via URL to survive the OAuth flow reliably
  return NextResponse.redirect(
    `${origin}/?draft_token=${encodeURIComponent(token)}`
  );
}
