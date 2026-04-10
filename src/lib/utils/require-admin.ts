import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

/**
 * Server-side guard that verifies the current user is an authenticated admin.
 * Returns `{ adminId }` on success or `{ error: NextResponse }` on failure.
 */
export async function requireAdmin(): Promise<
  { adminId: string } | { error: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return {
      error: NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      ),
    };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, role: true },
  });

  if (!dbUser) {
    return {
      error: NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 401 }
      ),
    };
  }

  if (dbUser.role !== 'ADMIN') {
    return {
      error: NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      ),
    };
  }

  return { adminId: dbUser.id };
}
