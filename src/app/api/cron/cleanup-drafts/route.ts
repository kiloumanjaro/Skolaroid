import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceRoleClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function cleanupExpiredDrafts(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        { error: 'CRON_SECRET is not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const expiredDrafts = await prisma.photoboothDraft.findMany({
      where: { expiresAt: { lt: new Date() }, usedAt: null },
      select: { id: true, photoPath: true },
    });

    if (expiredDrafts.length === 0) {
      return NextResponse.json({
        success: true,
        deletedCount: 0,
        storageDeletedCount: 0,
      });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    let storageDeletedCount = 0;

    if (supabaseUrl && serviceRoleKey) {
      const supabase = createServiceRoleClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const paths = expiredDrafts.map((d) => d.photoPath);
      const { error } = await supabase.storage
        .from('memory-media')
        .remove(paths);
      if (error) {
        console.error('[cleanup-drafts] storage removal error:', error);
      } else {
        storageDeletedCount = paths.length;
      }
    }

    const ids = expiredDrafts.map((d) => d.id);
    const result = await prisma.photoboothDraft.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      storageDeletedCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[cron/cleanup-drafts] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return cleanupExpiredDrafts(request);
}

export async function POST(request: NextRequest) {
  return cleanupExpiredDrafts(request);
}
