import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/prisma/user/deactivate
 *
 * Soft-deactivates the authenticated user's account:
 *   - Sets accountStatus = DEACTIVATED and deactivatedAt = now() on the User row
 *   - Sets deletedAt = now() on all their Memory rows (hides them immediately)
 *   - Does NOT hard-delete any rows — the nightly cleanup job handles that after 30 days
 *
 * The client is responsible for calling supabase.auth.signOut() after receiving 200.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const now = new Date();

    // Soft-delete memories then mark account deactivated, all in one transaction
    await prisma.$transaction([
      prisma.memory.updateMany({
        where: { creatorId: authUser.id, deletedAt: null },
        data: { deletedAt: now },
      }),
      prisma.user.update({
        where: { id: authUser.id },
        data: { accountStatus: 'DEACTIVATED', deactivatedAt: now },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Account deactivated successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
