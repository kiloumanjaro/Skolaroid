import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

const querySchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().datetime().optional(),
  type: z.enum(['upload', 'vote', 'comment']).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const result = querySchema.safeParse({
      userId: searchParams.get('userId'),
      limit: searchParams.get('limit') ?? undefined,
      cursor: searchParams.get('cursor') ?? undefined,
      type: searchParams.get('type') ?? undefined,
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

    if (!authUser || authUser.id !== result.data.userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { userId, limit, cursor, type } = result.data;
    const cursorDate = cursor ? new Date(cursor) : undefined;

    const memorySelect = {
      id: true,
      title: true,
      mediaURL: true,
      mediaURLs: true,
      createdAt: true,
      visibility: true,
      creatorId: true,
      privateGroupId: true,
      location: {
        select: {
          buildingName: true,
          latitude: true,
          longitude: true,
        },
      },
      _count: { select: { votes: true, comments: true } },
      tags: { select: { id: true, name: true } },
      creator: {
        select: { firstName: true, lastName: true, avatarUrl: true },
      },
    } as const;

    const fetchUploads =
      !type || type === 'upload'
        ? prisma.memory.findMany({
            where: {
              creatorId: userId,
              deletedAt: null,
              isArchived: false,
              ...(cursorDate && { createdAt: { lt: cursorDate } }),
            },
            select: memorySelect,
            orderBy: { createdAt: 'desc' },
            take: limit,
          })
        : Promise.resolve([]);

    const fetchVotes =
      !type || type === 'vote'
        ? prisma.memoryVote.findMany({
            where: {
              userId,
              ...(cursorDate && { createdAt: { lt: cursorDate } }),
            },
            select: {
              id: true,
              createdAt: true,
              memory: { select: memorySelect },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
          })
        : Promise.resolve([]);

    const fetchComments =
      !type || type === 'comment'
        ? prisma.memoryComment.findMany({
            where: {
              authorId: userId,
              deletedAt: null,
              ...(cursorDate && { createdAt: { lt: cursorDate } }),
            },
            select: {
              id: true,
              content: true,
              createdAt: true,
              memory: { select: memorySelect },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
          })
        : Promise.resolve([]);

    const [uploads, votes, comments] = await Promise.all([
      fetchUploads,
      fetchVotes,
      fetchComments,
    ]);

    type ActivityItem = {
      id: string;
      type: 'upload' | 'vote' | 'comment';
      createdAt: string;
      commentContent?: string;
      memory: {
        id: string;
        title: string;
        mediaURL?: string | null;
        mediaURLs?: string[];
        visibility: string;
        creatorId?: string | null;
        privateGroupId?: string | null;
        location: { buildingName: string; latitude: number; longitude: number };
        _count: { votes: number; comments: number };
        tags?: { id: string; name: string }[];
        creator?: {
          firstName: string;
          lastName: string;
          avatarUrl?: string | null;
        } | null;
      };
    };

    function shapeMemory(m: {
      id: string;
      title: string;
      mediaURL?: string | null;
      mediaURLs: string[];
      visibility: string;
      creatorId?: string | null;
      privateGroupId?: string | null;
      location: { buildingName: string; latitude: number; longitude: number };
      _count: { votes: number; comments: number };
      tags: { id: string; name: string }[];
      creator: {
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
      } | null;
    }): ActivityItem['memory'] {
      return {
        id: m.id,
        title: m.title,
        mediaURL: m.mediaURL,
        mediaURLs: m.mediaURLs,
        visibility: m.visibility,
        creatorId: m.creatorId,
        privateGroupId: m.privateGroupId,
        location: m.location,
        _count: m._count,
        tags: m.tags,
        creator: m.creator,
      };
    }

    const items: ActivityItem[] = [];

    for (const m of uploads) {
      items.push({
        id: m.id,
        type: 'upload',
        createdAt: m.createdAt.toISOString(),
        memory: shapeMemory(m),
      });
    }

    for (const v of votes) {
      if (!v.memory) continue;
      items.push({
        id: v.id,
        type: 'vote',
        createdAt: v.createdAt.toISOString(),
        memory: shapeMemory(v.memory),
      });
    }

    for (const c of comments) {
      if (!c.memory) continue;
      items.push({
        id: c.id,
        type: 'comment',
        createdAt: c.createdAt.toISOString(),
        commentContent: c.content,
        memory: shapeMemory(c.memory),
      });
    }

    items.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const sliced = items.slice(0, limit);
    const nextCursor =
      sliced.length === limit
        ? (sliced[sliced.length - 1]?.createdAt ?? null)
        : null;

    return NextResponse.json({
      success: true,
      message: 'Activity fetched successfully',
      data: sliced,
      nextCursor,
    });
  } catch (err) {
    console.error('[GET /api/prisma/user/activity/get]', err);
    const message =
      err instanceof Error
        ? `Unable to fetch activity: ${err.message}`
        : 'Unable to fetch activity. Please try again.';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
