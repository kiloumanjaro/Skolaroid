import { NextRequest, NextResponse } from 'next/server';
import { moderateMemorySchema } from '@/lib/schemas';
import { requireAdmin } from '@/lib/utils/require-admin';
import { prisma } from '@/lib/prisma';
import { notifyMemoryModeration } from '@/services/notification-service';

const ACTION_MAP = {
  APPROVED: 'MEMORY_APPROVED',
  REJECTED: 'MEMORY_REJECTED',
  REMOVED: 'MEMORY_REMOVED',
} as const;

export async function PATCH(request: NextRequest) {
  try {
    const result = await requireAdmin();
    if ('error' in result) return result.error;
    const { adminId } = result;

    const body = await request.json();
    const parsed = moderateMemorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message ?? 'Validation failed',
        },
        { status: 400 }
      );
    }

    const { memoryId, action, reason } = parsed.data;

    const memory = await prisma.memory.findFirst({
      where: { id: memoryId, deletedAt: null },
      select: { id: true },
    });

    if (!memory) {
      return NextResponse.json(
        { success: false, message: 'Memory not found' },
        { status: 404 }
      );
    }

    const [updated] = await prisma.$transaction([
      prisma.memory.update({
        where: { id: memoryId },
        data: { moderationStatus: action },
        select: { id: true, moderationStatus: true },
      }),
      prisma.moderationActionLog.create({
        data: {
          adminId,
          action: ACTION_MAP[action],
          targetType: 'MEMORY',
          targetMemoryId: memoryId,
          reason: reason ?? null,
        },
      }),
    ]);

    // Fire-and-forget: notification delivery failure must not affect the response
    notifyMemoryModeration(memoryId, action, reason).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Memory ${action.toLowerCase()} successfully`,
      data: updated,
    });
  } catch (error) {
    console.error('[PATCH /api/prisma/memory/admin/moderate]', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Unable to moderate memory. Please try again.',
      },
      { status: 500 }
    );
  }
}
