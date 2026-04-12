import { NextRequest, NextResponse } from 'next/server';
import { auditLogQuerySchema } from '@/lib/schemas';
import { requireAdmin } from '@/lib/utils/require-admin';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const result = await requireAdmin();
    if ('error' in result) return result.error;

    const { searchParams } = new URL(request.url);
    const parsed = auditLogQuerySchema.safeParse({
      action: searchParams.get('action') ?? undefined,
      adminId: searchParams.get('adminId') ?? undefined,
      dateFrom: searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? undefined,
      cursor: searchParams.get('cursor') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      sort: searchParams.get('sort') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message ?? 'Validation failed',
        },
        { status: 400 }
      );
    }

    const { action, adminId, dateFrom, dateTo, cursor, limit, sort } =
      parsed.data;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};
    if (action) where.action = action;
    if (adminId) where.adminId = adminId;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const rows = await prisma.moderationActionLog.findMany({
      where,
      orderBy: { createdAt: sort },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        admin: { select: { id: true, firstName: true, lastName: true } },
        targetMemory: { select: { id: true, title: true } },
        targetReport: { select: { id: true, reason: true, state: true } },
      },
    });

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null;

    return NextResponse.json({
      success: true,
      message: 'Audit log fetched successfully',
      data: { items, nextCursor, hasMore },
    });
  } catch (error) {
    console.error('[GET /api/prisma/moderation/audit-log]', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Unable to fetch audit log. Please try again.',
      },
      { status: 500 }
    );
  }
}
