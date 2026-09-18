import type { Prisma } from '@/generated/prisma/client';
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import {
  loadViewer,
  memoryListSelect,
  visibleToViewer,
} from '@/lib/server/memory-visibility';
import { mobileError, mobileJson } from '@/lib/server/mobile-response';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/mobile/feed
 *
 * The one list endpoint the app uses, for the gallery, a landmark's memories,
 * a person's memories and a group's memories.
 *
 * It exists because the web list routes return every visible memory in one
 * unbounded response, including each full story body. That is fine behind a
 * campus LAN and painful on cellular — this one pages, and leaves
 * `description` for the detail route.
 */

const querySchema = z.object({
  cursor: z.string().uuid().optional(),
  /** Offset alternative, used only by the vote sorts (see below). */
  skip: z.coerce.number().int().min(0).max(5000).catch(0),
  limit: z.coerce.number().int().min(1).max(50).catch(20),
  sort: z.enum(['newest', 'oldest', 'votes']).catch('newest'),
  locationId: z.string().uuid().optional(),
  creatorId: z.string().uuid().optional(),
  groupId: z.string().uuid().optional(),
  /** Decade, e.g. 2020 — matches the gallery's era rail. */
  era: z.coerce.number().int().min(1900).max(2999).optional(),
  tag: z.string().trim().min(1).max(50).optional(),
  q: z.string().trim().max(120).optional(),
  visibility: z
    .enum(['PUBLIC', 'PROGRAM_ONLY', 'BATCH_ONLY', 'GROUP_ONLY', 'PRIVATE'])
    .optional(),
});

/**
 * An era is normally carried by a `batch-YYYY` tag. Memories without one fall
 * back to their date, which mirrors `getEraFromBatchTag` on the client.
 */
function eraFilter(era: number): Prisma.MemoryWhereInput {
  const from = new Date(Date.UTC(era, 0, 1));
  const until = new Date(Date.UTC(era + 10, 0, 1));
  const batchTags = Array.from({ length: 10 }, (_, i) => `batch-${era + i}`);

  return {
    OR: [
      { tags: { some: { name: { in: batchTags } } } },
      {
        AND: [
          { tags: { none: { name: { startsWith: 'batch-' } } } },
          {
            OR: [
              { memoryDate: { gte: from, lt: until } },
              { memoryDate: null, createdAt: { gte: from, lt: until } },
            ],
          },
        ],
      },
    ],
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return mobileError('Unauthorized', 401);

    const parsed = querySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams)
    );
    if (!parsed.success) {
      return mobileError(
        parsed.error.issues[0]?.message ?? 'Invalid query parameters',
        400
      );
    }

    const {
      cursor,
      skip,
      limit,
      sort,
      locationId,
      creatorId,
      groupId,
      era,
      tag,
      q,
      visibility,
    } = parsed.data;

    const viewer = await loadViewer(user.id);
    if (!viewer) return mobileError('User not found', 404);

    const filters: Prisma.MemoryWhereInput[] = [visibleToViewer(viewer)];

    if (locationId) filters.push({ locationId });
    if (creatorId) filters.push({ creatorId });
    if (groupId) filters.push({ privateGroupId: groupId });
    if (visibility) filters.push({ visibility });
    if (era) filters.push(eraFilter(era));
    if (tag) filters.push({ tags: { some: { name: tag } } });
    if (q) {
      filters.push({
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { location: { buildingName: { contains: q, mode: 'insensitive' } } },
          { tags: { some: { name: { contains: q, mode: 'insensitive' } } } },
        ],
      });
    }

    const where: Prisma.MemoryWhereInput = { AND: filters };

    // Date sorts page by cursor, which stays correct as new memories arrive.
    // Sorting by vote count has no stable cursor key, so it falls back to an
    // offset — acceptable because nobody scrolls deep into a "most loved" list.
    const byVotes = sort === 'votes';
    const orderBy: Prisma.MemoryOrderByWithRelationInput[] = byVotes
      ? [{ votes: { _count: 'desc' } }, { id: 'desc' }]
      : [{ createdAt: sort === 'oldest' ? 'asc' : 'desc' }, { id: 'desc' }];

    // One extra row tells us whether another page exists without a count query.
    const rows = await prisma.memory.findMany({
      where,
      select: memoryListSelect,
      orderBy,
      take: limit + 1,
      ...(byVotes
        ? { skip }
        : cursor
          ? { cursor: { id: cursor }, skip: 1 }
          : {}),
    });

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    return mobileJson({
      success: true,
      message: 'Memories fetched successfully',
      data: {
        items,
        hasMore,
        nextCursor: hasMore && !byVotes ? (items.at(-1)?.id ?? null) : null,
        nextSkip: hasMore && byVotes ? skip + items.length : null,
      },
    });
  } catch (error) {
    console.error('[GET /api/mobile/feed]', error);
    return mobileError('Unable to fetch memories. Please try again.', 500);
  }
}
