import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * /api/prisma/invitation/cleanup
 *
 * Cron job endpoint to delete all expired invitations.
 * Secured via a CRON_SECRET header to prevent unauthorized access.
 *
 * Set up a nightly cron job (e.g. via Vercel Cron or external scheduler)
 * that calls this route with the Authorization header:
 *   Authorization: Bearer <CRON_SECRET>
 */
async function cleanupExpiredInvitations(request: NextRequest) {
  try {
    // ── 1. Verify cron secret ────────────────────────────────────────
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        { error: 'CRON_SECRET is not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── 2. Delete all expired invitations ────────────────────────────
    const result = await prisma.invitation.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.count} expired invitation(s)`,
      deletedCount: result.count,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[invitation/cleanup] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return cleanupExpiredInvitations(request);
}

export async function POST(request: NextRequest) {
  return cleanupExpiredInvitations(request);
}
