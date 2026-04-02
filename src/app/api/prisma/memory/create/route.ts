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

    const validation = createMemoryServerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            validation.error.issues[0]?.message || 'Invalid request data',
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Call service layer
    const memory = await createMemoryService({
      ...data,
      creatorId: authUser.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Memory created successfully',
      memory,
    });
  } catch (error) {
    console.error('Failed to create memory:', error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to create memory',
      },
      { status: 500 }
    );
  }
}
