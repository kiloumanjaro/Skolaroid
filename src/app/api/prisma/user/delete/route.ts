import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * DELETE /api/prisma/user/delete
 *
 * Handles user deletion:
 * - If user is not onboarded, just delete the auth user via raw SQL.
 * - If user is onboarded, delete auth user via raw SQL first, then delete the matching public user via Prisma.
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

    // Check the user_onboarded flag in the auth table (stored in app_metadata)
    const isOnboarded = authUser.app_metadata?.onboarded === true;

    if (!isOnboarded) {
      // User never finished onboarding, just delete the auth user via raw SQL
      await prisma.$executeRaw`DELETE FROM auth.users WHERE id = ${authUser.id}::uuid`;
    } else {
      // User is fully onboarded, delete auth user via raw SQL first
      await prisma.$executeRaw`DELETE FROM auth.users WHERE id = ${authUser.id}::uuid`;

      // Then delete the matching public user via Prisma
      await prisma.user.delete({
        where: { id: authUser.id },
      });
    }

    // Sign out to clear session cookies
    await supabase.auth.signOut();

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
