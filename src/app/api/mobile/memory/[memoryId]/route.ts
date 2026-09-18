import { NextRequest } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import {
  loadViewer,
  memoryDetailSelect,
  visibleToViewer,
} from '@/lib/server/memory-visibility';
import { mobileError, mobileJson } from '@/lib/server/mobile-response';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/mobile/memory/[memoryId]
 *
 * One memory, with the viewer's own vote resolved in the same round trip.
 *
 * There was no single-memory endpoint before: the web detail modal always
 * opened from a list it already had in memory. Deep links and push
 * notifications give the app no such list, and downloading every visible
 * memory to render one of them is not a trade worth making on a phone.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ memoryId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return mobileError('Unauthorized', 401);

    const { memoryId } = await context.params;
    if (!z.string().uuid().safeParse(memoryId).success) {
      return mobileError('Invalid memory ID', 400);
    }

    const viewer = await loadViewer(user.id);
    if (!viewer) return mobileError('User not found', 404);

    // The visibility clause is part of the lookup rather than a check after
    // it, so a memory the viewer may not see is indistinguishable from one
    // that does not exist.
    const [memory, vote] = await Promise.all([
      prisma.memory.findFirst({
        where: { AND: [{ id: memoryId }, visibleToViewer(viewer)] },
        select: memoryDetailSelect,
      }),
      prisma.memoryVote.findUnique({
        where: { memoryId_userId: { memoryId, userId: user.id } },
        select: { id: true },
      }),
    ]);

    if (!memory) return mobileError('Memory not found', 404);

    return mobileJson({
      success: true,
      message: 'Memory fetched successfully',
      data: {
        ...memory,
        viewer: {
          hasVoted: Boolean(vote),
          isOwner: memory.creatorId === user.id,
        },
      },
    });
  } catch (error) {
    console.error('[GET /api/mobile/memory/[memoryId]]', error);
    return mobileError('Unable to fetch this memory. Please try again.', 500);
  }
}
