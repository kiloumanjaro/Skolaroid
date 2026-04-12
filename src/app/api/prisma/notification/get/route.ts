import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { getNotificationsQuerySchema } from '@/lib/schemas';

export async function GET(request: NextRequest) {
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

    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = getNotificationsQuerySchema.safeParse(params);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message ?? 'Validation failed',
        },
        { status: 400 }
      );
    }

    const { cursor, limit, unreadOnly } = parsed.data;

    const where = {
      userId: authUser.id,
      ...(unreadOnly ? { read: false } : {}),
      ...(cursor ? { createdAt: { lt: undefined as Date | undefined } } : {}),
    };

    // For cursor-based pagination, get the cursor notification's createdAt
    if (cursor) {
      const cursorNotification = await prisma.notification.findUnique({
        where: { id: cursor },
        select: { createdAt: true },
      });
      if (cursorNotification) {
        where.createdAt = { lt: cursorNotification.createdAt };
      }
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        targetMemoryId: true,
        targetReportId: true,
        reason: true,
        read: true,
        createdAt: true,
      },
    });

    const hasMore = notifications.length > limit;
    const items = hasMore ? notifications.slice(0, limit) : notifications;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return NextResponse.json({
      success: true,
      data: { items, nextCursor, hasMore },
    });
  } catch (error) {
    console.error('[GET /api/prisma/notification/get]', error);
    return NextResponse.json(
      { success: false, message: 'Unable to fetch notifications.' },
      { status: 500 }
    );
  }
}
