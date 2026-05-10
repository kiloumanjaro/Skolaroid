import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

async function softDeleteUser(userId: string) {
  return await prisma.user.update({
    where: { id: userId },
    data: { deletedAt: new Date(), accountStatus: 'DEACTIVATED' },
  });
}

/**
 * POST /api/prisma/user/deactivate
 *
 * Soft-deactivates the authenticated user's account:
 *   - Sets deletedAt = now() and accountStatus = DEACTIVATED on the User row
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

    await softDeleteUser(authUser.id);

    return NextResponse.json({
      success: true,
      message: 'Account deactivated successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
