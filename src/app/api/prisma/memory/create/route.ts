import { NextRequest, NextResponse } from 'next/server';
import { createMemoryServerSchema } from '@/lib/schemas';
import { createMemoryService } from '@/services/create-memory-service';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
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

    const body = await request.json();

    const result = createMemoryServerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.error.issues[0]?.message ?? 'Validation failed',
        },
        { status: 400 }
      );
    }

    const memory = await createMemoryService(result.data, authUser.id);
    return NextResponse.json({
      success: true,
      message: 'Memory created successfully',
      data: memory,
    });
  } catch (err) {
    console.error('[create memory] unexpected error:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'Unable to create memory. Please try again.',
        detail: String(err),
      },
      { status: 500 }
    );
  }
}
