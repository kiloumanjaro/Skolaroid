import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * /api/prisma/user/deactivated-cleanup
 *
 * Daily cron job: hard-deletes accounts whose 30-day grace period has expired.
 *
 * Criteria: accountStatus = DEACTIVATED AND deactivatedAt <= now() - 30 days
 * Guard:    skips any account where deactivatedAt is null or in the future (idempotent-safe)
 * Order:    memories hard-deleted before the user row to satisfy FK constraints
 *
 * Secured with the same CRON_SECRET Bearer token used by other cron endpoints.
 */
async function cleanupDeactivatedAccounts(request: NextRequest) {
  try {
    // ── 1. Verify cron secret ────────────────────────────────────────────
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

    // ── 2. Compute the cutoff date ───────────────────────────────────────
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // ── 3. Find eligible accounts (guard: deactivatedAt must be non-null and past cutoff)
    const expired = await prisma.user.findMany({
      where: {
        accountStatus: 'DEACTIVATED',
        deactivatedAt: { not: null, lte: cutoff },
      },
      select: { id: true, deactivatedAt: true },
    });

    let deletedCount = 0;

    for (const account of expired) {
      // Extra guard — skip if deactivatedAt somehow became null or future
      if (!account.deactivatedAt || account.deactivatedAt > cutoff) {
        console.warn(
          `[deactivated-cleanup] Skipped account ${account.id}: deactivatedAt guard failed`
        );
        continue;
      }

      try {
        // Hard-delete memories first, then the user row (FK order)
        await prisma.$transaction([
          prisma.memory.deleteMany({ where: { creatorId: account.id } }),
          prisma.user.delete({ where: { id: account.id } }),
        ]);

        console.log(
          `[deactivated-cleanup] Hard-deleted account ${account.id} ` +
            `(deactivatedAt: ${account.deactivatedAt.toISOString()}) ` +
            `at ${new Date().toISOString()}`
        );
        deletedCount++;
      } catch (err) {
        // Log but continue — lets the job process remaining accounts even if one fails
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error(
          `[deactivated-cleanup] Failed to delete account ${account.id}: ${msg}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Hard-deleted ${deletedCount} expired account(s)`,
      deletedCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[deactivated-cleanup] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return cleanupDeactivatedAccounts(request);
}

export async function POST(request: NextRequest) {
  return cleanupDeactivatedAccounts(request);
}
