import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getEraFromBatchTag } from '@/lib/utils';

/**
 * GET /api/public/memory/gallery?era=2020
 *
 * Public endpoint — no session required.
 * Returns only PUBLIC + APPROVED memories, optionally filtered by era decade.
 * Era filtering mirrors the authenticated gallery logic using getEraFromBatchTag.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const eraParam = searchParams.get('era');
  const era = eraParam !== null ? parseInt(eraParam, 10) : null;

  try {
    const memories = await prisma.memory.findMany({
      where: {
        deletedAt: null,
        visibility: 'PUBLIC',
        moderationStatus: 'APPROVED',
      },
      select: {
        id: true,
        title: true,
        description: true,
        creatorId: true,
        locationId: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        isArchived: true,
        visibility: true,
        programBatchId: true,
        privateGroupId: true,
        memoryDate: true,
        moderationStatus: true,
        mediaURLs: true,
        location: {
          select: {
            buildingName: true,
            latitude: true,
            longitude: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        tags: true,
        programBatch: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const filtered =
      era !== null
        ? memories.filter(
            (m) =>
              getEraFromBatchTag(
                (m.tags ?? []) as { name: string }[],
                m.createdAt.toISOString()
              ) === era
          )
        : memories;

    return NextResponse.json({
      success: true,
      message: 'Public memories fetched successfully',
      data: filtered,
      era: era ?? null,
    });
  } catch (error) {
    console.error('[GET /api/public/memory/gallery]', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch memories' },
      { status: 500 }
    );
  }
}
