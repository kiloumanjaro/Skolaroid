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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {
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
