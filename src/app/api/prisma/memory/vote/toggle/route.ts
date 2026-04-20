import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { toggleVoteSchema } from '@/lib/schemas';
import { toggleVoteService } from '@/services/toggle-vote-service';

// ---------------------------------------------------------------------------
// In-process rate limiter
// ---------------------------------------------------------------------------
// Stores the last toggle timestamp (ms) per "userId:memoryId" pair.
// Resets on server restart. This is intentionally lightweight — the client
// already applies a matching 2-second debounce, so only abusive/scripted
// traffic reaches this guard.
//
// TODO (production scale): replace with a Redis/Upstash KV store so the
// limit is enforced across all serverless instances, not just one process.
// ---------------------------------------------------------------------------
const _rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 2_000;

function isRateLimited(userId: string, memoryId: string): boolean {
  const key = `${userId}:${memoryId}`;
  const last = _rateLimitMap.get(key);
  const now = Date.now();

  if (last !== undefined && now - last < RATE_LIMIT_MS) return true;

  _rateLimitMap.set(key, now);
  return false;
}

/**
 * Resolves the userId for the request.
 * Requires a real Supabase session and an existing Prisma User row.
 *
 * Returns:
 *   { userId: string }  — proceed with this user
 *   { error: NextResponse } — return this response immediately
 */
async function resolveUser(): Promise<
  { userId: string } | { error: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (authUser) {
    // Real session: verify the Prisma User row exists (FK requirement).
    const dbUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { id: true },
    });

    if (!dbUser) {
      return {
        error: NextResponse.json(
          {
            success: false,
            message: 'Complete onboarding before voting',
          },
          { status: 403 }
        ),
      };
    }

    return { userId: dbUser.id };
  }

  return {
    error: NextResponse.json(
      { success: false, message: 'Not authenticated' },
      { status: 401 }
    ),
  };
}

// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // ── 1. Auth ────────────────────────────────────────────────────────────
    const resolved = await resolveUser();
    if ('error' in resolved) return resolved.error;
    const { userId } = resolved;

    // ── 2. Validate body ───────────────────────────────────────────────────
    const body = await request.json();
    const parsed = toggleVoteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message ?? 'Validation failed',
        },
        { status: 400 }
      );
    }

    const { memoryId } = parsed.data;

    // ── 3. Verify memory is approved ────────────────────────────────────────
    const memory = await prisma.memory.findFirst({
      where: { id: memoryId, deletedAt: null, moderationStatus: 'APPROVED' },
      select: { id: true },
    });

    if (!memory) {
      return NextResponse.json(
        { success: false, message: 'Memory not found' },
        { status: 404 }
      );
    }

    // ── 4. Rate limit ──────────────────────────────────────────────────────
    if (isRateLimited(userId, memoryId)) {
      return NextResponse.json(
        { success: false, message: 'Too many requests — slow down.' },
        { status: 429 }
      );
    }

    // ── 5. Toggle vote ─────────────────────────────────────────────────────
    const result = await toggleVoteService(memoryId, userId);

    return NextResponse.json({
      success: true,
      message: result.voted ? 'Vote added' : 'Vote removed',
      data: result,
    });
  } catch (err) {
    console.error('[vote/toggle] unexpected error:', err);
    return NextResponse.json(
      { success: false, message: 'Unable to process vote. Please try again.' },
      { status: 500 }
    );
  }
}
