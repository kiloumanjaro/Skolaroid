import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // 1. Authenticate user
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

    // 2. Get groupId from query params
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');

    if (!groupId) {
      return NextResponse.json(
        { success: false, message: 'Group ID required' },
        { status: 400 }
      );
    }

    // 3. Verify user is a group member
    const group = await prisma.privateGroup.findUnique({
      where: { id: groupId, deletedAt: null },
      include: { members: { select: { id: true } } },
    });

    if (!group) {
      return NextResponse.json(
        { success: false, message: 'Group not found' },
        { status: 404 }
      );
    }

    const isMember = group.members.some(
      (m: { id: string }) => m.id === user.id
    );

    if (!isMember) {
      return NextResponse.json(
        { success: false, message: 'Not authorized to view this group' },
        { status: 403 }
      );
    }

    // 4. Fetch memories for this group
    const memories = await prisma.memory.findMany({
      where: {
        privateGroupId: groupId,
        visibility: 'GROUP_ONLY',
        deletedAt: null,
        OR: [{ moderationStatus: 'APPROVED' }, { creatorId: user.id }],
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        location: true,
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
      data: memories,
    });
  } catch (error) {
    console.error('Error fetching group memories:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
