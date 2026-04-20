import { NextRequest, NextResponse } from 'next/server';
import { adminMemoriesQuerySchema } from '@/lib/schemas';
import { requireAdmin } from '@/lib/utils/require-admin';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const result = await requireAdmin();
    if ('error' in result) return result.error;

    const { searchParams } = new URL(request.url);
    const parsed = adminMemoriesQuerySchema.safeParse({
      status: searchParams.get('status'),
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

    const memories = await prisma.memory.findMany({
      where: {
        deletedAt: null,
        moderationStatus: parsed.data.status,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        programBatch: {
          include: {
            batch: { select: { year: true } },
          },
        },
        location: {
          select: { buildingName: true },
        },
        tags: true,
        _count: {
          select: { reports: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      message: 'Memories fetched successfully',
      data: memories,
    });
  } catch (error) {
    console.error('[GET /api/prisma/memory/admin/get-by-status]', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Unable to fetch memories. Please try again.',
      },
      { status: 500 }
    );
  }
}
