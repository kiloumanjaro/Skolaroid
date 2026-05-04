import { NextRequest, NextResponse } from 'next/server';
import { adminReportsQuerySchema } from '@/lib/schemas';
import { requireAdmin } from '@/lib/utils/require-admin';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const result = await requireAdmin();
    if ('error' in result) return result.error;

    const { searchParams } = new URL(request.url);
    const stateParam = searchParams.get('state');
    const parsed = adminReportsQuerySchema.safeParse({
      state: stateParam ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message ?? 'Validation failed',
        },
        { status: 400 }
      );
    }

    const where = parsed.data.state ? { state: parsed.data.state } : {};

    const reports = await prisma.report.findMany({
      where,
      include: {
        reporter: {
          select: { firstName: true, lastName: true },
        },
        memory: {
          select: { id: true, title: true, mediaURLs: true },
        },
        resolvedBy: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      message: 'Reports fetched successfully',
      data: reports,
    });
  } catch (error) {
    console.error('[GET /api/prisma/report/admin/get-all]', error);
    return NextResponse.json(
      { success: false, message: 'Unable to fetch reports. Please try again.' },
      { status: 500 }
    );
  }
}
