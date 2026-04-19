import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/slugify';
import { MAX_TAGS, type MemoryVisibility } from '@/lib/schemas';
import { generateAutoTags } from '@/lib/utils/memory-tags';
import { assertCanPostInGroup } from '@/lib/server/group-permissions';
import {
  isContentPrescreeningEnabled,
  moderationPolicyService,
} from '@/services/moderation-policy-service';

interface CreateMemoryInput {
  title: string;
  description?: string;
  visibility: MemoryVisibility;
  locationId: string;
  programBatchId: string;
  memoryDate?: Date;
  tags?: string[];
  mediaURL?: string;
  creatorId: string;
  privateGroupId?: string;
}
/**
 * Create a memory with auto-generated tags
 */
export async function createMemoryService(
  input: CreateMemoryInput
): Promise<{ id: string }> {
  const {
    title,
    description,
    visibility,
    locationId,
    programBatchId,
    memoryDate,
    tags: userTags = [],
    mediaURL,
    creatorId,
    privateGroupId,
  } = input;

  const prescreeningEnabled = isContentPrescreeningEnabled();
  const moderationResult = prescreeningEnabled
    ? moderationPolicyService({ title, description })
    : null;

  if (visibility === 'GROUP_ONLY' && !privateGroupId) {
    throw new Error('Group ID is required for group-only memories');
  }

  if (privateGroupId) {
    await assertCanPostInGroup(creatorId, privateGroupId);
  }

  // Generate auto-tags
  const autoTags = await generateAutoTags(locationId, memoryDate);

  // Merge auto-tags (priority) with user tags, deduplicating by slug
  const allTagNames = [...autoTags, ...(userTags || [])];
  const uniqueTags: string[] = [];
  const seenSlugs = new Set<string>();

  for (const tagName of allTagNames) {
    const slug = slugify(tagName);
    if (!seenSlugs.has(slug)) {
      seenSlugs.add(slug);
      uniqueTags.push(tagName);
    }
  }

  // Respect MAX_TAGS limit
  const finalTags = uniqueTags.slice(0, MAX_TAGS);

  // Build tag connect/create operations
  const tagOperations = finalTags.map((tagName) => ({
    where: { slug: slugify(tagName) },
    create: { name: tagName, slug: slugify(tagName) },
  }));

  // Create memory with all relations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {
    title,
    description,
    mediaURL,
    visibility,
    ...(prescreeningEnabled && {
      moderationStatus:
        moderationResult?.status === 'flag' ? 'PENDING' : 'APPROVED',
    }),
    creator: {
      connect: { id: creatorId },
    },
    location: {
      connect: { id: locationId },
    },
    programBatch: {
      connect: { id: programBatchId },
    },
    ...(privateGroupId && {
      privateGroup: {
        connect: { id: privateGroupId },
      },
    }),
    tags: {
      connectOrCreate: tagOperations,
    },
  };

  if (memoryDate) {
    data.memoryDate = memoryDate;
  }

  const memory = await prisma.memory.create({
    data,
    select: {
      id: true,
    },
  });

  return memory;
}
