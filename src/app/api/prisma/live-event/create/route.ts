import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/utils/require-admin';

const createLiveEventSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    description: z.string().trim().max(500).optional(),
    bannerColor: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color (e.g. #3B82F6)'),
    startAt: z.coerce.date(),
    endAt: z.coerce.date(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  })
  .refine((d) => d.endAt > d.startAt, {
    message: 'endAt must be after startAt',
    path: ['endAt'],
  });

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if ('error' in admin) return admin.error;

    const body = await request.json();
    const parsed = createLiveEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message ?? 'Validation error',
        },
        { status: 400 }
      );
    }

    const {
      name,
      description,
      bannerColor,
      startAt,
      endAt,
      latitude,
      longitude,
    } = parsed.data;

    // Upsert a Location for this event (@@unique on lat/lng prevents duplicates)
    const location = await prisma.location.upsert({
      where: { latitude_longitude: { latitude, longitude } },
      update: {},
      create: { buildingName: name, latitude, longitude },
    });

    const event = await prisma.liveEvent.create({
      data: {
        name,
        description,
        bannerColor,
        startAt,
        endAt,
        creatorId: admin.adminId,
        locationId: location.id,
      },
      include: { location: true },
    });

    return NextResponse.json({ success: true, data: event }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/prisma/live-event/create]', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create live event' },
      { status: 500 }
    );
  }
}
