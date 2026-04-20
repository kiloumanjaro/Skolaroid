import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceRoleClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const BUCKET = 'memory-media';
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_PREFIXES = ['image/', 'video/'];

export async function POST(request: NextRequest) {
  try {
    const supabaseAuthClient = await createServerClient();
    const {
      data: { user: authUser },
    } = await supabaseAuthClient.auth.getUser();

    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, message: 'File exceeds the 10 MB size limit' },
        { status: 400 }
      );
    }

    const isAllowedType = ALLOWED_MIME_PREFIXES.some((prefix) =>
      file.type.startsWith(prefix)
    );
    if (!isAllowedType) {
      return NextResponse.json(
        { success: false, message: 'Only image and video files are allowed' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[upload-memory-media] missing Supabase env vars');
      return NextResponse.json(
        {
          success: false,
          message: 'Server misconfiguration: missing Supabase credentials',
        },
        { status: 500 }
      );
    }

    const supabase = createServiceRoleClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Ensure the bucket exists (creates it on first run if missing).
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets();
    if (listError) {
      console.error('[upload-memory-media] could not list buckets:', listError);
    } else {
      const exists = buckets?.some((b) => b.name === BUCKET);
      if (!exists) {
        console.log(
          `[upload-memory-media] bucket "${BUCKET}" not found, creating it…`
        );
        const { error: createError } = await supabase.storage.createBucket(
          BUCKET,
          {
            public: true,
          }
        );
        if (createError) {
          console.error(
            '[upload-memory-media] failed to create bucket:',
            createError
          );
          return NextResponse.json(
            {
              success: false,
              message: `Storage bucket "${BUCKET}" does not exist and could not be created`,
              detail: createError.message,
            },
            { status: 500 }
          );
        }
        console.log(
          `[upload-memory-media] bucket "${BUCKET}" created successfully`
        );
      }
    }

    // Build a unique storage path: {uuid}.{ext}
    const ext = file.name.split('.').pop() ?? 'bin';
    const filename = `${crypto.randomUUID()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('[upload-memory-media] storage error:', uploadError);
      return NextResponse.json(
        {
          success: false,
          message: `Failed to upload file: ${uploadError.message}`,
          detail: uploadError.message,
        },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(filename);

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (err) {
    console.error('[upload-memory-media] unexpected error:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'Unexpected error during upload',
        detail: String(err),
      },
      { status: 500 }
    );
  }
}
