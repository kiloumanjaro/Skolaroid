import { prisma } from '@/lib/prisma';

export interface CommentAuthor {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
}

export interface Comment {
  id: string;
  content: string;
  memoryId: string;
  authorId: string;
  author: CommentAuthor;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetCommentsResult {
  items: Comment[];
  nextCursor: string | null;
  hasMore: boolean;
}

const AUTHOR_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
} as const;

/**
 * Fetches comments for a memory using cursor-based pagination.
 *
 * Strategy: fetch `limit + 1` rows. If we get back more than `limit`,
 * there is a next page — trim the extra row and use the last item's id
 * as the cursor. This avoids a separate COUNT query for pagination state.
 *
 * Comments are ordered newest-first so the most recent appear at the top.
 * Soft-deleted comments (deletedAt != null) are excluded.
 */
export async function getCommentsService(
  memoryId: string,
  limit: number,
  cursor?: string
): Promise<GetCommentsResult> {
  const rows = await prisma.memoryComment.findMany({
    where: { memoryId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1, // skip the cursor row itself
        }
      : {}),
    select: {
      id: true,
      content: true,
      memoryId: true,
      authorId: true,
      author: { select: AUTHOR_SELECT },
      createdAt: true,
      updatedAt: true,
    },
  });

  const hasMore = rows.length > limit;
  const items: Comment[] = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null;

  return { items, nextCursor, hasMore };
}
