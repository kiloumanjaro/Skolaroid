import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/slugify';
import { findNearestLandmark } from '@/lib/utils/map-utils';
import { MAX_TAGS, type MemoryVisibility } from '@/lib/schemas';
import {
  canRoleUsePermission,
  resolveGroupMemberRole,
} from '@/lib/group-permissions';

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
 * Generate auto-tags for a memory based on location and date
 */
async function generateAutoTags(
  locationId: string,
  memoryDate?: Date
): Promise<string[]> {
  const autoTags: string[] = [];

  // 1. Fetch location to get coordinates and buildingName
  const location = await prisma.location.findUnique({
    where: { id: locationId },
    select: {
      buildingName: true,
      latitude: true,
      longitude: true,
    },
  });

  if (!location) {
    throw new Error(`Location with ID ${locationId} not found`);
  }

  // 2. Generate landmark tag
  const { buildingName, latitude, longitude } = location;

  if (buildingName) {
    // Use buildingName directly if it's a known landmark
    autoTags.push(buildingName);
  } else {
    // For custom locations, find nearest landmark and create "Near X" tag
    const nearest = findNearestLandmark({ latitude, longitude });
    if (nearest && nearest.distance < 100) {
      // Within 100 meters
      autoTags.push(`Near ${nearest.landmark.name}`);
    } else if (nearest) {
      // Fallback to nearest landmark name even if far
      autoTags.push(`Near ${nearest.landmark.name}`);
    }
  }

  // 3. Generate era tag (decade)
  const referenceYear = memoryDate
    ? memoryDate.getFullYear()
    : new Date().getFullYear();
  const decade = Math.floor(referenceYear / 10) * 10;
  autoTags.push(`${decade}s`);

  // 4. Generate year tag (only if memoryDate is provided)
  if (memoryDate) {
    autoTags.push(`${referenceYear}`);
  }

  return autoTags;
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

  if (visibility === 'GROUP_ONLY' && !privateGroupId) {
    throw new Error('Group ID is required for group-only memories');
  }

  if (privateGroupId) {
    const group = await prisma.privateGroup.findUnique({
      where: { id: privateGroupId, deletedAt: null },
      select: {
        id: true,
        creatorId: true,
        rolePrivileges: true,
        members: {
          where: { id: creatorId },
          select: { id: true },
        },
        groupMemberships: {
          where: { userId: creatorId },
          select: { role: true },
        },
      },
    });

    if (!group) {
      throw new Error('Group not found');
    }

    const isMemberInGroup =
      group.members.length > 0 || group.groupMemberships.length > 0;

    if (!isMemberInGroup) {
      throw new Error('You are not a member of this group');
    }

    const role = resolveGroupMemberRole(
      creatorId,
      group.creatorId,
      group.groupMemberships[0]?.role
    );

    if (!canRoleUsePermission(group.rolePrivileges, role, 'editContent')) {
      throw new Error('Your role cannot post in this group');
    }
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
