import type { Prisma } from '@/generated/prisma/client';

import { prisma } from '@/lib/prisma';

/**
 * Everything a visibility decision depends on, resolved once per request.
 *
 * The rules were previously re-typed in every memory route. They are identical
 * in each, so a drift in one of them silently leaks private memories — hence
 * one definition here.
 */
export interface MemoryViewer {
  userId: string;
  programBatchId: string;
  groupIds: string[];
}

/** Loads the viewer's cohort and group memberships. `null` if not onboarded. */
export async function loadViewer(userId: string): Promise<MemoryViewer | null> {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
    select: {
      programBatchId: true,
      groupMemberships: { select: { groupId: true } },
    },
  });

  if (!dbUser) return null;

  return {
    userId,
    programBatchId: dbUser.programBatchId,
    groupIds: dbUser.groupMemberships.map((membership) => membership.groupId),
  };
}

/**
 * The `where` clause limiting a memory query to what this viewer may see:
 * not deleted, not moderated away (unless it is their own), and within the
 * visibility tier they belong to.
 */
export function visibleToViewer(viewer: MemoryViewer): Prisma.MemoryWhereInput {
  return {
    deletedAt: null,
    moderationStatus: { notIn: ['REMOVED', 'REJECTED'] },
    AND: [
      { OR: [{ moderationStatus: 'APPROVED' }, { creatorId: viewer.userId }] },
      {
        OR: [
          { visibility: 'PUBLIC' },
          { creatorId: viewer.userId },
          { visibility: 'PROGRAM_ONLY', programBatchId: viewer.programBatchId },
          { visibility: 'BATCH_ONLY', programBatchId: viewer.programBatchId },
          { visibility: 'GROUP_ONLY', privateGroupId: { in: viewer.groupIds } },
        ],
      },
    ],
  };
}

/**
 * Field set for a memory shown in a list or on a card.
 *
 * Deliberately omits `description`, which is the single largest column and is
 * never rendered in a list — a phone on campus wifi should not download every
 * story just to draw thumbnails.
 */
export const memoryListSelect = {
  id: true,
  title: true,
  mediaURLs: true,
  visibility: true,
  moderationStatus: true,
  creatorId: true,
  privateGroupId: true,
  createdAt: true,
  memoryDate: true,
  location: {
    select: { id: true, buildingName: true, latitude: true, longitude: true },
  },
  creator: {
    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
  },
  tags: { select: { id: true, name: true } },
  _count: { select: { votes: true, comments: true } },
} satisfies Prisma.MemorySelect;

/** Everything the detail screen renders, including the story body. */
export const memoryDetailSelect = {
  ...memoryListSelect,
  description: true,
  updatedAt: true,
  liveEventId: true,
} satisfies Prisma.MemorySelect;
