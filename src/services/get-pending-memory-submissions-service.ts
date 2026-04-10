import { prisma } from '@/lib/prisma';

export async function getFlaggedMemorySubmissionsService() {
  return prisma.memory.findMany({
    where: {
      deletedAt: null,
      moderationStatus: 'PENDING',
    },
    include: {
      creator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      location: {
        select: {
          id: true,
          buildingName: true,
        },
      },
      tags: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export const getPendingMemorySubmissionsService =
  getFlaggedMemorySubmissionsService;
