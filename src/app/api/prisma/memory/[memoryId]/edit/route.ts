import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { editMemoryServerSchema } from '@/lib/schemas';
import { updateMemoryService } from '@/services/update-memory-service';

/**
 * PATCH /api/prisma/memory/[memoryId]/edit
 *
 * Updates a memory's title, description, tags, visibility, or privateGroupId.
 * Only the creator or a platform admin may edit a memory.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ memoryId: string }> }
) {
  try {
    const { memoryId } = await params;

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

    // ── 2. Fetch memory + actor role in parallel ──────────────────────
    const [memory, dbUser] = await Promise.all([
      prisma.memory.findUnique({
        where: { id: memoryId, deletedAt: null },
        select: { id: true, creatorId: true },
      }),
      prisma.user.findUnique({
        where: { id: authUser.id },
        select: { role: true },
      }),
    ]);

    if (!memory) {
      return NextResponse.json(
        { success: false, message: 'Memory not found' },
        { status: 404 }
      );
    }

    const isAdmin = dbUser?.role === 'ADMIN';

    if (memory.creatorId !== authUser.id && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: 'Only the creator or an admin can edit this memory',
        },
        { status: 403 }
      );
    }

    // ── 3. Validate body ─────────────────────────────────────────────
    const body = await request.json();
    const parsed = editMemoryServerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message ?? 'Invalid input',
        },
        { status: 400 }
      );
    }

    // ── 4. Service ───────────────────────────────────────────────────
    await updateMemoryService({
      memoryId,
      actorId: authUser.id,
      isAdmin,
      data: parsed.data,
    });

    // ── 5. Return updated memory with relations ───────────────────────
    const updated = await prisma.memory.findUnique({
      where: { id: memoryId },
      include: {
        tags: true,
        location: { select: { id: true, buildingName: true } },
        creator: { select: { firstName: true, lastName: true } },
        _count: { select: { votes: true, comments: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Memory updated successfully',
      data: updated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'Memory not found' || message === 'Group not found') {
      return NextResponse.json({ success: false, message }, { status: 404 });
    }

    if (
      message === 'You are not a member of this group' ||
      message === 'Your role cannot post in this group' ||
      message === 'Group ID is required for group-only memories'
    ) {
      return NextResponse.json({ success: false, message }, { status: 400 });
    }

    console.error('[memory/edit] Error:', message);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
