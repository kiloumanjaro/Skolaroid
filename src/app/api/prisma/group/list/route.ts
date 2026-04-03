import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/prisma/group/list
 *
 * Returns all non-deleted private groups that the authenticated user
 * is a member of, ordered by most recently created first.
 */
export async function GET() {
  try {
    // ── 1. Authenticate ──────────────────────────────────────────────
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // ── 2. Fetch groups where user is a member ───────────────────────
    const groups = await prisma.privateGroup.findMany({
      where: {
        deletedAt: null,
        members: { some: { id: authUser.id } },
      },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        members: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        groupMemberships: {
          select: { userId: true, role: true, joinedAt: true },
        },
        _count: { select: { members: true, memories: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      message: 'Groups fetched successfully',
      data: groups,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[group/list] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
