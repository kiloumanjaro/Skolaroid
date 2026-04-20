import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { voteStatusQuerySchema } from '@/lib/schemas';

export async function GET(request: NextRequest) {
  try {
    // ── 1. Validate query params ───────────────────────────────────────────
    const { searchParams } = new URL(request.url);
    const parsed = voteStatusQuerySchema.safeParse({
      memoryId: searchParams.get('memoryId'),
    });

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

    // ── 2. Vote count — public data, always returned ───────────────────────
    const voteCount = await prisma.memoryVote.count({ where: { memoryId } });

    // ── 3. Resolve userId (optional — hasVoted falls back to false) ────────
    let hasVoted = false;

    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (authUser) {
      const dbUser = await prisma.user.findUnique({
        where: { id: authUser.id },
        select: { id: true },
      });

      if (dbUser) {
        const vote = await prisma.memoryVote.findUnique({
          where: { memoryId_userId: { memoryId, userId: dbUser.id } },
          select: { id: true },
        });
        hasVoted = !!vote;
      }
    }

    return NextResponse.json({
      success: true,
      data: { hasVoted, voteCount },
    });
  } catch (err) {
    console.error('[vote/status] unexpected error:', err);
    return NextResponse.json(
      { success: false, message: 'Unable to fetch vote status.' },
      { status: 500 }
    );
  }
}
