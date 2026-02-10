import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { users } = await request.json();

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        { error: 'Users array is required and must not be empty' },
        { status: 400 }
      );
    }

    const result = await prisma.user.createMany({
      data: users.map((user: { email: string; name?: string }) => ({
        email: user.email,
        name: user.name || null,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      message: 'Users created successfully',
      count: result.count,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
