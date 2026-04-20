import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { createCommentSchema } from '@/lib/schemas';

/**
 * Resolves the authenticated user for this request.
 */
async function resolveUser(): Promise<
  { userId: string } | { error: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (authUser) {
    const dbUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { id: true },
    });

    if (!dbUser) {
      return {
        error: NextResponse.json(
          { success: false, message: 'Complete onboarding before commenting' },
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
    const parsed = createCommentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message ?? 'Validation failed',
        },
        { status: 400 }
      );
    }

    const { memoryId, content } = parsed.data;

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

    // ── 4. Create comment ──────────────────────────────────────────────────
    const comment = await prisma.memoryComment.create({
      data: { memoryId, authorId: userId, content },
      select: {
        id: true,
        content: true,
        memoryId: true,
        authorId: true,
        author: { select: { id: true, firstName: true, lastName: true } },
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Comment created',
      data: comment,
    });
  } catch (err) {
    console.error('[comment/create] unexpected error:', err);
    return NextResponse.json(
      { success: false, message: 'Unable to post comment. Please try again.' },
      { status: 500 }
    );
  }
}
