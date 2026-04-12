import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
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

    const count = await prisma.notification.count({
      where: { userId: authUser.id, read: false },
    });

    return NextResponse.json({ success: true, data: { count } });
  } catch (error) {
    console.error('[GET /api/prisma/notification/unread-count]', error);
    return NextResponse.json(
      { success: false, message: 'Unable to fetch unread count.' },
      { status: 500 }
    );
  }
}
