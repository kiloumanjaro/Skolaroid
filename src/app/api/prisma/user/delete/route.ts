import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

async function hardDeleteUser(userId: string) {
  return await prisma.user.delete({ where: { id: userId } });
}

/**
 * DELETE /api/prisma/user/delete
 *
 * Permanently deletes the authenticated user's Prisma User row.
 * Only admins may use this endpoint.
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

    const dbUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { role: true },
    });

    if (dbUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await hardDeleteUser(authUser.id);

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[user/delete] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
