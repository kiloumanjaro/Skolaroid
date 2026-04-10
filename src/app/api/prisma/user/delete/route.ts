import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * DELETE /api/prisma/user/delete
 *
 * Performs a cascading soft-delete: sets `deletedAt` on the authenticated User
 * and on every Memory record they created, all within a single Prisma
 * transaction to guarantee data consistency.
 */
export async function DELETE() {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const now = new Date();

    await prisma.$transaction([
      // Soft-delete all Memory records owned by this user
      prisma.memory.updateMany({
        where: { creatorId: authUser.id, deletedAt: null },
        data: { deletedAt: now },
      }),
      // Soft-delete the User record
      prisma.user.update({
        where: { id: authUser.id },
        data: { deletedAt: now },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
