import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchQuerySchema } from '@/lib/schemas';
import { searchService } from '@/services/search-service';

/**
 * GET /api/prisma/search
 *
 * Global search endpoint across Memories, Users, Locations, Tags, and Batches.
 * Enforces memory visibility rules based on the authenticated user's cohorts and groups.
 */
export async function GET(request: NextRequest) {
  try {
    // ── 1. Authenticate ──────────────────────────────────────────────
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

    // ── 2. ValidateQueryParams ───────────────────────────────────────
    const { searchParams } = new URL(request.url);
    const query = {
      q: searchParams.get('q') || '',
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    };

    const parsed = searchQuerySchema.safeParse(query);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            parsed.error.issues[0]?.message ?? 'Invalid search parameters',
        },
        { status: 400 }
      );
    }

    const { q, page, limit } = parsed.data;

    // ── 3. Execute Search Service ────────────────────────────────────
    const searchData = await searchService(q, authUser.id, page, limit);

    // ── 4. Return Data ───────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      message: 'Search completed successfully',
      data: searchData,
    });
  } catch (error) {
    console.error('[search/route] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'User not found') {
      return NextResponse.json({ success: false, message }, { status: 404 });
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
