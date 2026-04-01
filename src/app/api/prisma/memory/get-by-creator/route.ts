import { NextRequest, NextResponse } from 'next/server';
import { memoriesByCreatorQuerySchema } from '@/lib/schemas';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const result = memoriesByCreatorQuerySchema.safeParse({
      userId: searchParams.get('userId'),
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.error.issues[0]?.message ?? 'Validation failed',
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    const isOwner = authUser?.id === result.data.userId;

    const memories = await prisma.memory.findMany({
      where: {
        creatorId: result.data.userId,
        deletedAt: null,
        isArchived: false,
        // Non-owners can only see public memories
        ...(!isOwner && { visibility: 'PUBLIC' }),
      },
      include: {
        tags: true,
        location: { select: { id: true, buildingName: true } },
        creator: { select: { firstName: true, lastName: true } },
        _count: { select: { votes: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      message: 'Memories fetched successfully',
      data: memories,
    });
  } catch (err) {
    console.error('[GET /api/prisma/memory/get-by-creator]', err);

    const message =
      err instanceof Error
        ? `Unable to fetch memories: ${err.message}`
        : 'Unable to fetch memories. Please try again.';

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}
