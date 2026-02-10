import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function DELETE() {
  try {
    const result = await prisma.user.deleteMany({
      where: {},
    });

    return NextResponse.json({
      success: true,
      message: 'All users deleted successfully',
      count: result.count,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
