import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/utils/require-admin';

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if ('error' in admin) return admin.error;

    const { id } = await params;

    const event = await prisma.liveEvent.findUnique({ where: { id } });
    if (!event) {
      return NextResponse.json(
        { success: false, message: 'Event not found' },
        { status: 404 }
      );
    }

    await prisma.liveEvent.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PATCH /api/prisma/live-event/[id]/deactivate]', error);
    return NextResponse.json(
      { success: false, message: 'Failed to deactivate event' },
      { status: 500 }
    );
  }
}
