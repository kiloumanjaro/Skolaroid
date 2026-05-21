import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient as createServiceRoleClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { validateUploadBuffer } from '@/lib/server/validate-upload';

const BUCKET = 'memory-media';
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const DRAFT_TTL_MS = 30 * 60 * 1000; // 30 minutes

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const eventId = formData.get('eventId') as string | null;
    const caption = (formData.get('caption') as string | null) ?? undefined;
    const tagsRaw = (formData.get('tags') as string | null) ?? '[]';

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }

    if (!eventId) {
      return NextResponse.json(
        { success: false, message: 'eventId is required' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, message: 'File exceeds the 10 MB size limit' },
        { status: 400 }
      );
    }

    let tags: string[] = [];
    try {
      tags = JSON.parse(tagsRaw);
      if (!Array.isArray(tags)) tags = [];
    } catch {
      tags = [];
    }

    // Validate the event exists and is active
    const now = new Date();
    const event = await prisma.liveEvent.findFirst({
      where: {
        id: eventId,
        isActive: true,
        startAt: { lte: now },
        endAt: { gte: now },
      },
      select: { id: true },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, message: 'Event not found or not currently active' },
        { status: 404 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { success: false, message: 'Server misconfiguration' },
        { status: 500 }
      );
    }

    const supabase = createServiceRoleClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const validation = await validateUploadBuffer(buffer);
    if (!validation.ok) {
      return NextResponse.json(
        { success: false, message: validation.reason },
        { status: 400 }
      );
    }

    const token = crypto.randomBytes(32).toString('hex');
    const storagePath = `photobooth-temp/${token}.${validation.ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: validation.mime,
        upsert: false,
      });

    if (uploadError) {
      console.error('[photobooth-draft/create] storage error:', uploadError);
      return NextResponse.json(
        {
          success: false,
          message: `Failed to upload photo: ${uploadError.message}`,
        },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

    const expiresAt = new Date(Date.now() + DRAFT_TTL_MS);

    const draft = await prisma.photoboothDraft.create({
      data: {
        token,
        photoPath: storagePath,
        caption: caption ?? null,
        tags: tags,
        eventId,
        expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      token: draft.token,
      photoUrl: publicUrl,
      expiresAt: draft.expiresAt,
    });
  } catch (error) {
    console.error('[POST /api/photobooth-draft/create]', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create draft' },
      { status: 500 }
    );
  }
}
