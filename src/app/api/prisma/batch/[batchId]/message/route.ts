import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { createMessageServerSchema } from '@/lib/schemas';
import { createBatchMessageService } from '@/services/message-service';

/**
 * POST /api/prisma/batch/[batchId]/message
 *
 * Broadcasts a text-only announcement as a BATCH_ONLY Memory post.
 * The actor's programBatchId must match the batchId in the URL.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const { batchId } = await params;

    // ── 1. Authenticate ──────────────────────────────────────────────
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // ── 2. Validate body ─────────────────────────────────────────────
    const body = await request.json();
    const parsed = createMessageServerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // ── 3. Check user exists in DB ───────────────────────────────────
    const dbUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { id: true, programBatchId: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found. Complete onboarding first.' },
        { status: 404 }
      );
    }

    // ── 4. Enforce batch ownership ───────────────────────────────────
    if (dbUser.programBatchId !== batchId) {
      return NextResponse.json(
        { error: 'You do not belong to this batch' },
        { status: 403 }
      );
    }

    // ── 5. Delegate to service ───────────────────────────────────────
    const data = await createBatchMessageService({
      actorId: dbUser.id,
      content: parsed.data.content,
      locationId: parsed.data.locationId,
      programBatchId: dbUser.programBatchId,
    });

    revalidateTag('batch-messages');

    return NextResponse.json({
      success: true,
      message: 'Message created',
      data,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[batch/message/create] Error:', msg);

    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
