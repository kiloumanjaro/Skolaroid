import { prisma } from '@/lib/prisma';

export async function searchService(
  query: string,
  actorId: string,
  page: number,
  limit: number
) {
  const skip = (page - 1) * limit;
  const searchFilter = { contains: query, mode: 'insensitive' as const };

  // 1. Get actor's cohorts and groups to enforce visibility rules
  const user = await prisma.user.findUnique({
    where: { id: actorId, deletedAt: null },
    select: {
      programBatchId: true,
      groupMemberships: { select: { groupId: true } },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const userGroupIds = user.groupMemberships.map(
    (membership: { groupId: string }) => membership.groupId
  );

  // 2. Build Memory Visibility Filter
  const memoryVisibilityFilter = {
    OR: [
      { visibility: 'PUBLIC' as const },
      {
        visibility: 'PROGRAM_ONLY' as const,
        creator: { programBatchId: user.programBatchId },
      },
      {
        visibility: 'BATCH_ONLY' as const,
        creator: { programBatchId: user.programBatchId },
      },
      {
        visibility: 'GROUP_ONLY' as const,
        privateGroupId: { in: userGroupIds },
      },
      { visibility: 'PRIVATE' as const, creatorId: actorId },
    ],
  };

  // 3. Execute Searches Concurrently
  const [users, memories, locations, tags, batches] = await Promise.all([
    // USERS
    prisma.user.findMany({
      where: {
        deletedAt: null,
        OR: [
          { firstName: searchFilter },
          { lastName: searchFilter },
          { email: searchFilter },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        programBatch: {
          select: {
            program: { select: { name: true } },
            batch: { select: { year: true } },
          },
        },
      },
      skip,
      take: limit,
      orderBy: { lastName: 'asc' },
    }),

    // MEMORIES
    prisma.memory.findMany({
      where: {
        deletedAt: null,
        isArchived: false,
        moderationStatus: 'APPROVED',
        AND: [
          memoryVisibilityFilter,
          {
            OR: [
              { title: searchFilter },
              { description: searchFilter },
              { tags: { some: { name: searchFilter } } },
              { location: { buildingName: searchFilter } },
            ],
          },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        mediaURLs: true,
        memoryDate: true,
        createdAt: true,
        creator: { select: { firstName: true, lastName: true } },
        location: { select: { id: true, buildingName: true } },
        tags: { select: { id: true, name: true, slug: true } },
        programBatch: {
          select: {
            program: { select: { name: true } },
            batch: { select: { year: true } },
          },
        },
      },
      skip,
      take: limit,
      // Order by chronological batch order (if applicable) or created date
      orderBy: [
        { programBatch: { batch: { year: 'desc' } } },
        { memoryDate: 'desc' },
        { createdAt: 'desc' },
      ],
    }),

    // LOCATIONS
    prisma.location.findMany({
      where: {
        OR: [{ buildingName: searchFilter }, { description: searchFilter }],
      },
      select: {
        id: true,
        buildingName: true,
        description: true,
        latitude: true,
        longitude: true,
        _count: { select: { memories: true } },
      },
      skip,
      take: limit,
      orderBy: { buildingName: 'asc' },
    }),

    // TAGS
    prisma.tag.findMany({
      where: {
        name: searchFilter,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { memories: true } },
      },
      skip,
      take: limit,
      orderBy: { memories: { _count: 'desc' } },
    }),

    // BATCHES / PROGRAMS
    prisma.programBatch.findMany({
      where: {
        OR: [
          { program: { name: searchFilter } },
          { batch: { year: { equals: parseInt(query) || 0 } } },
        ],
      },
      select: {
        id: true,
        program: { select: { name: true } },
        batch: { select: { year: true } },
      },
      skip,
      take: limit,
      orderBy: { batch: { year: 'desc' } },
    }),
  ]);

  return {
    users,
    memories,
    locations,
    tags,
    batches,
  };
}
