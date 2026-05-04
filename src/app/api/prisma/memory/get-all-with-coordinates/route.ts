import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const memories = await prisma.memory.findMany({
      where: {
        deletedAt: null,
        moderationStatus: { notIn: ['REMOVED', 'REJECTED'] },
        AND: [
          {
            OR: [{ moderationStatus: 'APPROVED' }, { creatorId: user.id }],
          },
          {
            OR: [
              { visibility: 'PUBLIC' },
              { creator: { id: user.id } },
              {
                AND: [
                  { visibility: 'PROGRAM_ONLY' },
                  { programBatch: { students: { some: { id: user.id } } } },
                ],
              },
              {
                AND: [
                  { visibility: 'BATCH_ONLY' },
                  { programBatch: { students: { some: { id: user.id } } } },
                ],
              },
              {
                AND: [
                  { visibility: 'GROUP_ONLY' },
                  { privateGroup: { members: { some: { id: user.id } } } },
                ],
              },
            ],
          },
        ],
      },
      include: {
        location: {
          select: {
            id: true,
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
        programBatch: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Memories fetched successfully',
      data: memories,
    });
  } catch (error) {
    console.error('[GET /api/prisma/memory/get-all-with-coordinates]', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Unable to fetch memories. Please try again.',
      },
      { status: 500 }
    );
  }
}
