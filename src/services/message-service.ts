import { prisma } from '@/lib/prisma';
import { assertCanPostInGroup } from '@/lib/server/group-permissions';

interface CreateGroupMessagePayload {
  actorId: string;
  content: string;
  locationId: string;
  programBatchId: string;
  groupId: string;
}

interface CreateBatchMessagePayload {
  actorId: string;
  content: string;
  locationId: string;
  programBatchId: string;
}

export async function createGroupMessageService(
  payload: CreateGroupMessagePayload
): Promise<{ id: string }> {
  const { actorId, content, locationId, programBatchId, groupId } = payload;

  await assertCanPostInGroup(actorId, groupId);

  const memory = await prisma.memory.create({
    data: {
      title: content.slice(0, 255),
      description: content,
      visibility: 'GROUP_ONLY',
      moderationStatus: 'APPROVED',
      creator: { connect: { id: actorId } },
      location: { connect: { id: locationId } },
      programBatch: { connect: { id: programBatchId } },
      privateGroup: { connect: { id: groupId } },
    },
    select: { id: true },
  });

  return memory;
}

export async function createBatchMessageService(
  payload: CreateBatchMessagePayload
): Promise<{ id: string }> {
  const { actorId, content, locationId, programBatchId } = payload;

  const memory = await prisma.memory.create({
    data: {
      title: content.slice(0, 255),
      description: content,
      visibility: 'BATCH_ONLY',
      creator: { connect: { id: actorId } },
      location: { connect: { id: locationId } },
      programBatch: { connect: { id: programBatchId } },
    },
    select: { id: true },
  });

  return memory;
}
