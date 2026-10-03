import { NextRequest, NextResponse } from 'next/server';
import { updateMemoryTagsSchema } from '@/lib/schemas';
import { slugify } from '@/lib/slugify';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

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

    const body: unknown = await request.json();
    const result = updateMemoryTagsSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.error.issues[0]?.message ?? 'Validation failed',
        },
        { status: 400 }
      );
    }

    const [memory, dbUser] = await Promise.all([
      prisma.memory.findUnique({
        where: { id: result.data.memoryId, deletedAt: null },
        select: {
          creatorId: true,
          visibility: true,
          moderationStatus: true,
          tags: { select: { slug: true } },
        },
      }),
      prisma.user.findUnique({
        where: { id: authUser.id },
        select: { role: true },
      }),
    ]);

    if (!memory) {
      return NextResponse.json(
        { success: false, message: 'Memory not found' },
        { status: 404 }
      );
    }

    const isAdmin = dbUser?.role === 'ADMIN';
    if (memory.creatorId !== authUser.id && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: 'Only the creator or an admin can edit this memory',
        },
        { status: 403 }
      );
    }

    // New tags are content an admin has not reviewed; same rule as the edit
    // route in update-memory-service.
    const currentTagSlugs = new Set(memory.tags.map((tag) => tag.slug));
    const addsTags = result.data.tags.some(
      (name) => !currentTagSlugs.has(slugify(name))
    );
    const needsReview =
      !isAdmin &&
      addsTags &&
      memory.visibility !== 'GROUP_ONLY' &&
      memory.moderationStatus === 'APPROVED';

    const updated = await prisma.memory.update({
      where: { id: result.data.memoryId },
      data: {
        ...(needsReview && { moderationStatus: 'PENDING' }),
        tags: {
          set: [],
          connectOrCreate: result.data.tags.map((name) => ({
            where: { slug: slugify(name) },
            create: { name, slug: slugify(name) },
          })),
        },
      },
      include: { tags: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Tags updated successfully',
      data: { memoryId: updated.id, tags: updated.tags },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: 'Unable to update tags. Please try again.',
      },
      { status: 500 }
    );
  }
}
