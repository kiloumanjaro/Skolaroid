import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LANDMARKS } from '@/lib/constants/landmarks';

export async function GET() {
  try {
    const counts = await prisma.memory.groupBy({
      by: ['locationId'],
      where: { deletedAt: null, moderationStatus: 'APPROVED' },
      _count: { id: true },
    });

    const countByLocationId = new Map(
      counts.map((c) => [c.locationId, c._count.id])
    );

    const data: Record<string, number> = {};
    for (const landmark of LANDMARKS) {
      data[landmark.id] = countByLocationId.get(landmark.id) ?? 0;
    }

    return NextResponse.json({
      success: true,
      message: 'Memory counts fetched successfully',
      data,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: 'Unable to fetch memory counts. Please try again.',
      },
      { status: 500 }
    );
  }
}
