import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();
    const events = await prisma.liveEvent.findMany({
      where: {
        isActive: true,
        startAt: { lte: now },
        endAt: { gte: now },
      },
      include: {
        location: true,
      },
      orderBy: { startAt: 'asc' },
    });

    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    console.error('[GET /api/prisma/live-event/get-active]', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch live events' },
      { status: 500 }
    );
  }
}
