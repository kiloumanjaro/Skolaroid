import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const WINDOW_MS = 5 * 60 * 1000;
const LIMIT = 10;

/**
 * Per-user sliding-window rate limit for the upload endpoint.
 * Returns `{ ok: true }` on allow, `{ error: NextResponse }` on throttle.
 *
 * Not atomic: two concurrent requests at the boundary may each see
 * `count = LIMIT - 1` and both insert. Acceptable for a volume guard.
 */
export async function requireUploadRateLimit(
  userId: string
): Promise<{ ok: true } | { error: NextResponse }> {
  const windowStart = new Date(Date.now() - WINDOW_MS);

  await prisma.uploadRateLimit.deleteMany({
    where: { userId, createdAt: { lt: windowStart } },
  });

  const recent = await prisma.uploadRateLimit.findMany({
    where: { userId, createdAt: { gte: windowStart } },
    orderBy: { createdAt: 'asc' },
    select: { createdAt: true },
  });

  if (recent.length >= LIMIT) {
    const oldestMs = recent[0].createdAt.getTime();
    const retryAfterSec = Math.max(
      1,
      Math.ceil((oldestMs + WINDOW_MS - Date.now()) / 1000)
    );
    return {
      error: NextResponse.json(
        {
          success: false,
          message: `Too many uploads. Try again in ${retryAfterSec} seconds.`,
        },
        { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
      ),
    };
  }

  await prisma.uploadRateLimit.create({ data: { userId } });
  return { ok: true };
}
