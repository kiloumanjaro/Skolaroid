import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { createMemoryService } from '@/services/create-memory-service';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: authUser.id, deletedAt: null },
      select: { id: true, programBatchId: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const { token } = await params;

    const draft = await prisma.photoboothDraft.findUnique({
      where: { token },
      include: {
        event: { include: { location: true } },
      },
    });

    if (!draft) {
      return NextResponse.json(
        { success: false, message: 'Draft not found' },
        { status: 404 }
      );
    }

    if (draft.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, message: 'Draft has expired' },
        { status: 410 }
      );
    }

    if (draft.usedAt !== null) {
      return NextResponse.json(
        { success: false, message: 'Draft has already been used' },
        { status: 409 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const photoUrl = `${supabaseUrl}/storage/v1/object/public/memory-media/${draft.photoPath}`;

    const tags = Array.isArray(draft.tags) ? (draft.tags as string[]) : [];

    const memory = await createMemoryService({
      title: draft.event.name,
      description: draft.caption ?? undefined,
      visibility: 'PUBLIC',
      locationId: draft.event.locationId,
      programBatchId: dbUser.programBatchId,
      tags,
      mediaURLs: [photoUrl],
      creatorId: authUser.id,
      liveEventId: draft.eventId,
    });

    await prisma.photoboothDraft.update({
      where: { token },
      data: { usedAt: new Date() },
    });

    return NextResponse.json({ success: true, data: { memoryId: memory.id } });
  } catch (error) {
    console.error('[POST /api/photobooth-draft/[token]/submit]', error);
    return NextResponse.json(
      { success: false, message: 'Failed to submit draft' },
      { status: 500 }
    );
  }
}
