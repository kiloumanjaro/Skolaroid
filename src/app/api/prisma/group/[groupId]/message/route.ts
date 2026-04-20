import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { createMessageServerSchema } from '@/lib/schemas';
import { createGroupMessageService } from '@/services/message-service';

/**
 * POST /api/prisma/group/[groupId]/message
 *
 * Broadcasts a text-only announcement as a GROUP_ONLY Memory post.
 * Requires the actor to be a group member with the editContent privilege.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;

    // ── 1. Authenticate ──────────────────────────────────────────────
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    // ── 2. Validate body ─────────────────────────────────────────────
    const body = await request.json();
    const parsed = createMessageServerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0].message },
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
        {
          success: false,
          message: 'User not found. Complete onboarding first.',
        },
        { status: 404 }
      );
    }

    // ── 4. Delegate to service ───────────────────────────────────────
    const data = await createGroupMessageService({
      actorId: dbUser.id,
      content: parsed.data.content,
      locationId: parsed.data.locationId,
      programBatchId: dbUser.programBatchId,
      groupId,
    });

    revalidateTag('group-messages', 'max');

    return NextResponse.json({
      success: true,
      message: 'Message created',
      data,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[group/message/create] Error:', msg);

    if (msg === 'Group not found') {
      return NextResponse.json(
        { success: false, message: msg },
        { status: 404 }
      );
    }
    if (
      msg === 'You are not a member of this group' ||
      msg === 'Your role cannot post in this group'
    ) {
      return NextResponse.json(
        { success: false, message: msg },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
