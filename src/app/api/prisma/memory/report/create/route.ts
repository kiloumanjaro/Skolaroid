import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { createReportSchema } from '@/lib/schemas';

async function resolveReporter(): Promise<
  { userId: string } | { error: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (authUser) {
    const dbUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { id: true },
    });

    if (!dbUser) {
      return {
        error: NextResponse.json(
          {
            success: false,
            message: 'Complete onboarding before submitting reports',
          },
          { status: 403 }
        ),
      };
    }

    return { userId: dbUser.id };
  }

  return {
    error: NextResponse.json(
      { success: false, message: 'Not authenticated' },
      { status: 401 }
    ),
  };
}

export async function POST(request: NextRequest) {
  try {
    const resolved = await resolveReporter();
    if ('error' in resolved) return resolved.error;
    const { userId } = resolved;

    const body = await request.json();
    const parsed = createReportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message ?? 'Validation failed',
        },
        { status: 400 }
      );
    }

    const { memoryId, reason } = parsed.data;

    const memory = await prisma.memory.findFirst({
      where: { id: memoryId, deletedAt: null },
      select: { id: true },
    });

    if (!memory) {
      return NextResponse.json(
        { success: false, message: 'Memory not found' },
        { status: 404 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const existingOpenReport = await tx.report.findFirst({
        where: {
          reporterId: userId,
          memoryId,
          state: 'OPEN',
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true, state: true },
      });

      if (existingOpenReport) {
        return { report: existingOpenReport, deduped: true };
      }

      const createdReport = await tx.report.create({
        data: {
          reporterId: userId,
          memoryId,
          reason,
        },
        select: { id: true, state: true },
      });

      return { report: createdReport, deduped: false };
    });

    return NextResponse.json(
      {
        success: true,
        message: result.deduped
          ? 'An open report for this memory already exists'
          : 'Report submitted successfully',
        data: {
          reportId: result.report.id,
          status: result.report.state,
          deduped: result.deduped,
        },
      },
      { status: result.deduped ? 200 : 201 }
    );
  } catch (error) {
    console.error('[memory/report/create] unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to submit report. Please try again.' },
      { status: 500 }
    );
  }
}
