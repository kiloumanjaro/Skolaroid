import { NextRequest, NextResponse } from 'next/server';
import { resolveReportSchema } from '@/lib/schemas';
import { requireAdmin } from '@/lib/utils/require-admin';
import { prisma } from '@/lib/prisma';

const ACTION_MAP = {
  RESOLVED: 'REPORT_RESOLVED',
  DISMISSED: 'REPORT_DISMISSED',
} as const;

export async function PATCH(request: NextRequest) {
  try {
    const result = await requireAdmin();
    if ('error' in result) return result.error;
    const { adminId } = result;

    const body = await request.json();
    const parsed = resolveReportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message ?? 'Validation failed',
        },
        { status: 400 }
      );
    }

    const { reportId, action, resolutionNote } = parsed.data;

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      select: { id: true, state: true },
    });

    if (!report) {
      return NextResponse.json(
        { success: false, message: 'Report not found' },
        { status: 404 }
      );
    }

    if (report.state !== 'OPEN') {
      return NextResponse.json(
        {
          success: false,
          message: 'Report has already been resolved or dismissed',
        },
        { status: 409 }
      );
    }

    const [updated] = await prisma.$transaction([
      prisma.report.update({
        where: { id: reportId },
        data: {
          state: action,
          resolvedById: adminId,
          resolvedAt: new Date(),
          resolutionNote: resolutionNote ?? null,
        },
        select: { id: true, state: true },
      }),
      prisma.moderationActionLog.create({
        data: {
          adminId,
          action: ACTION_MAP[action],
          targetType: 'REPORT',
          targetReportId: reportId,
          reason: resolutionNote ?? null,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Report ${action.toLowerCase()} successfully`,
      data: updated,
    });
  } catch (error) {
    console.error('[PATCH /api/prisma/report/admin/resolve]', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Unable to resolve report. Please try again.',
      },
      { status: 500 }
    );
  }
}
