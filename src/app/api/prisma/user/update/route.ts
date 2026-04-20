import { prisma } from '@/lib/prisma';
import { updateProfileSchema } from '@/lib/schemas';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * PATCH /api/prisma/user/update
 *
 * Updates editable profile fields (bio, phone, social links, avatarUrl).
 * Identity fields (name, email, studentId, programBatch) are immutable here.
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Strip empty strings → null so the DB stores clean nulls
    const data = Object.fromEntries(
      Object.entries(parsed.data).map(([k, v]) => [k, v === '' ? null : v])
    );

    const updated = await prisma.user.update({
      where: { id: authUser.id },
      data,
    });

    revalidatePath('/profile');
    revalidatePath('/', 'layout');

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
