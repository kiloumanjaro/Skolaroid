import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const draft = await prisma.photoboothDraft.findUnique({
      where: { token },
      include: {
        event: {
          include: { location: true },
        },
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

    return NextResponse.json({ success: true, data: draft });
  } catch (error) {
    console.error('[GET /api/photobooth-draft/[token]]', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch draft' },
      { status: 500 }
    );
  }
}
