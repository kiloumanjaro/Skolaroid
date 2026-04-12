import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { markNotificationsReadSchema } from '@/lib/schemas';

export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const parsed = markNotificationsReadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message ?? 'Validation failed',
        },
        { status: 400 }
      );
    }

    const { notificationIds } = parsed.data;

    const result = await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId: authUser.id,
      },
      data: { read: true },
    });

    return NextResponse.json({
      success: true,
      message: `${result.count} notification(s) marked as read`,
      data: { updatedCount: result.count },
    });
  } catch (error) {
    console.error('[PATCH /api/prisma/notification/mark-read]', error);
    return NextResponse.json(
      { success: false, message: 'Unable to mark notifications as read.' },
      { status: 500 }
    );
  }
}
