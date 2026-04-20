import { NextRequest, NextResponse } from 'next/server';
import { adminAnalyticsQuerySchema } from '@/lib/schemas';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/utils/require-admin';

const MEMORY_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'REMOVED'] as const;
type MemoryStatus = (typeof MEMORY_STATUSES)[number];

interface BatchEngagementAccumulator {
  programBatchId: string;
  batchYear: number;
  programName: string;
  totalUsers: number;
  activeUsers: number;
}

function calculateWindowStart(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export async function GET(request: NextRequest) {
  try {
    const result = await requireAdmin();
    if ('error' in result) return result.error;

    const { searchParams } = new URL(request.url);
    const parsed = adminAnalyticsQuerySchema.safeParse({
      days: searchParams.get('days') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message ?? 'Validation failed',
        },
        { status: 400 }
      );
    }

    const { days } = parsed.data;
    const windowStart = calculateWindowStart(days);

    const [
      totalMemories,
      totalUsers,
      memoryCountsByStatus,
      topLocationGroups,
      activeMemoryCreators,
      activeCommentAuthors,
      activeVoters,
      activeReporters,
      activeReportResolvers,
      usersByBatch,
    ] = await Promise.all([
      prisma.memory.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null } }),
      Promise.all(
        MEMORY_STATUSES.map(async (status) => ({
          status,
          count: await prisma.memory.count({
            where: {
              deletedAt: null,
              moderationStatus: status,
            },
          }),
        }))
      ),
      prisma.memory.groupBy({
        by: ['locationId'],
        where: { deletedAt: null },
        _count: { locationId: true },
        orderBy: { _count: { locationId: 'desc' } },
        take: 8,
      }),
      prisma.memory.findMany({
        where: {
          deletedAt: null,
          creatorId: { not: null },
          createdAt: { gte: windowStart },
        },
        select: { creatorId: true },
        distinct: ['creatorId'],
      }),
      prisma.memoryComment.findMany({
        where: {
          deletedAt: null,
          createdAt: { gte: windowStart },
        },
        select: { authorId: true },
        distinct: ['authorId'],
      }),
      prisma.memoryVote.findMany({
        where: {
          createdAt: { gte: windowStart },
        },
        select: { userId: true },
        distinct: ['userId'],
      }),
      prisma.report.findMany({
        where: {
          createdAt: { gte: windowStart },
        },
        select: { reporterId: true },
        distinct: ['reporterId'],
      }),
      prisma.report.findMany({
        where: {
          resolvedById: { not: null },
          resolvedAt: { gte: windowStart },
        },
        select: { resolvedById: true },
        distinct: ['resolvedById'],
      }),
      prisma.user.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          programBatchId: true,
          programBatch: {
            select: {
              batch: { select: { year: true } },
              program: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    const locationIds = topLocationGroups.map((group) => group.locationId);
    const locations =
      locationIds.length > 0
        ? await prisma.location.findMany({
            where: { id: { in: locationIds } },
            select: { id: true, buildingName: true },
          })
        : [];

    const locationNameById = new Map(
      locations.map((location) => [location.id, location.buildingName])
    );

    const topLocations = topLocationGroups.map((group, index) => ({
      rank: index + 1,
      locationId: group.locationId,
      buildingName:
        locationNameById.get(group.locationId) ?? 'Unknown location',
      memoryCount: group._count.locationId,
    }));

    const activeUserIds = new Set<string>();

    for (const row of activeMemoryCreators) {
      if (row.creatorId) activeUserIds.add(row.creatorId);
    }

    for (const row of activeCommentAuthors) {
      activeUserIds.add(row.authorId);
    }

    for (const row of activeVoters) {
      activeUserIds.add(row.userId);
    }

    for (const row of activeReporters) {
      activeUserIds.add(row.reporterId);
    }

    for (const row of activeReportResolvers) {
      if (row.resolvedById) activeUserIds.add(row.resolvedById);
    }

    const activeUsers = activeUserIds.size;
    const activeUserRate =
      totalUsers === 0
        ? 0
        : Number(((activeUsers / totalUsers) * 100).toFixed(1));

    const engagementByBatch = new Map<string, BatchEngagementAccumulator>();

    for (const user of usersByBatch) {
      const existing =
        engagementByBatch.get(user.programBatchId) ??
        ({
          programBatchId: user.programBatchId,
          batchYear: user.programBatch.batch.year,
          programName: user.programBatch.program.name,
          totalUsers: 0,
          activeUsers: 0,
        } satisfies BatchEngagementAccumulator);

      existing.totalUsers += 1;
      if (activeUserIds.has(user.id)) {
        existing.activeUsers += 1;
      }

      engagementByBatch.set(user.programBatchId, existing);
    }

    const batchEngagementRates = Array.from(engagementByBatch.values())
      .map((row) => ({
        ...row,
        engagementRate:
          row.totalUsers === 0
            ? 0
            : Number(((row.activeUsers / row.totalUsers) * 100).toFixed(1)),
      }))
      .sort((a, b) => {
        if (b.engagementRate !== a.engagementRate) {
          return b.engagementRate - a.engagementRate;
        }
        if (b.activeUsers !== a.activeUsers) {
          return b.activeUsers - a.activeUsers;
        }
        return b.batchYear - a.batchYear;
      });

    const averageBatchEngagementRate =
      batchEngagementRates.length === 0
        ? 0
        : Number(
            (
              batchEngagementRates.reduce(
                (total, batch) => total + batch.engagementRate,
                0
              ) / batchEngagementRates.length
            ).toFixed(1)
          );

    const memoryStatusLookup = new Map<MemoryStatus, number>(
      memoryCountsByStatus.map((row) => [row.status, row.count])
    );

    const memoriesByStatus = MEMORY_STATUSES.map((status) => ({
      status,
      count: memoryStatusLookup.get(status) ?? 0,
    }));

    return NextResponse.json({
      success: true,
      message: 'Analytics fetched successfully',
      data: {
        generatedAt: new Date().toISOString(),
        windowDays: days,
        totals: {
          memories: totalMemories,
          users: totalUsers,
          activeUsers,
          activeUserRate,
          averageBatchEngagementRate,
        },
        memoriesByStatus,
        topLocations,
        batchEngagementRates,
      },
    });
  } catch (error) {
    console.error('[GET /api/prisma/admin/analytics]', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Unable to fetch analytics. Please try again.',
      },
      { status: 500 }
    );
  }
}
