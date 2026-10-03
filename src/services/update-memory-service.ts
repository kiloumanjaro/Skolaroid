import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/slugify';
import { MAX_TAGS, type EditMemoryInput } from '@/lib/schemas';
import { generateAutoTags } from '@/lib/utils/memory-tags';
import { assertCanPostInGroup } from '@/lib/server/group-permissions';

interface UpdateMemoryInput {
  memoryId: string;
  actorId: string;
  isAdmin: boolean;
  data: EditMemoryInput;
}

export async function updateMemoryService(
  input: UpdateMemoryInput
): Promise<{ id: string }> {
  const { memoryId, actorId, isAdmin, data } = input;

  const memory = await prisma.memory.findUnique({
    where: { id: memoryId, deletedAt: null },
    select: {
      id: true,
      creatorId: true,
      locationId: true,
      memoryDate: true,
      visibility: true,
      privateGroupId: true,
      moderationStatus: true,
      title: true,
      description: true,
      tags: { select: { slug: true } },
    },
  });

  if (!memory) {
    throw new Error('Memory not found');
  }

  const effectiveVisibility = data.visibility ?? memory.visibility;
  // null means explicitly unset; undefined means not provided (keep existing)
  const effectivePrivateGroupId =
    data.privateGroupId !== undefined
      ? data.privateGroupId
      : memory.privateGroupId;

  if (effectiveVisibility === 'GROUP_ONLY' && !effectivePrivateGroupId) {
    throw new Error('Group ID is required for group-only memories');
  }

  if (
    !isAdmin &&
    data.privateGroupId !== undefined &&
    data.privateGroupId !== null &&
    data.privateGroupId !== memory.privateGroupId
  ) {
    await assertCanPostInGroup(actorId, data.privateGroupId);
  }

  const updateData: Prisma.MemoryUpdateInput = {
    ...(data.title !== undefined && { title: data.title }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.visibility !== undefined && { visibility: data.visibility }),
    ...(data.privateGroupId !== undefined && {
      privateGroup:
        data.privateGroupId === null
          ? { disconnect: true }
          : { connect: { id: data.privateGroupId } },
    }),
  };

  // Approval covers the content and audience an admin actually saw. Group
  // memories skip review at creation, so without this a creator could post to
  // a one-person group and flip it to PUBLIC, or swap an approved memory's
  // text after the fact. Removed/rejected memories keep their status so an
  // edit cannot resurrect them.
  // Edit forms resend every field, so compare values rather than presence.
  const currentTagSlugs = new Set(memory.tags.map((tag) => tag.slug));
  const changesReviewedContent =
    (data.title !== undefined && data.title !== memory.title) ||
    (data.description !== undefined &&
      (data.description || null) !== (memory.description || null)) ||
    (data.tags !== undefined &&
      data.tags.some((tag) => !currentTagSlugs.has(slugify(tag)))) ||
    effectiveVisibility !== memory.visibility ||
    effectivePrivateGroupId !== memory.privateGroupId;

  if (
    !isAdmin &&
    changesReviewedContent &&
    effectiveVisibility !== 'GROUP_ONLY' &&
    memory.moderationStatus === 'APPROVED'
  ) {
    updateData.moderationStatus = 'PENDING';
  }

  if (data.tags !== undefined) {
    const autoTags = await generateAutoTags(
      memory.locationId,
      memory.memoryDate ?? undefined
    );

    const allTagNames = [...autoTags, ...data.tags];
    const uniqueTags: string[] = [];
    const seenSlugs = new Set<string>();

    for (const tagName of allTagNames) {
      const slug = slugify(tagName);
      if (!seenSlugs.has(slug)) {
        seenSlugs.add(slug);
        uniqueTags.push(tagName);
      }
    }

    const finalTags = uniqueTags.slice(0, MAX_TAGS);

    updateData.tags = {
      set: [],
      connectOrCreate: finalTags.map((tagName) => ({
        where: { slug: slugify(tagName) },
        create: { name: tagName, slug: slugify(tagName) },
      })),
    };
  }

  const updated = await prisma.memory.update({
    where: { id: memoryId },
    data: updateData,
    select: { id: true },
  });

  return updated;
}
