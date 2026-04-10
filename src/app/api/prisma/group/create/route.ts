import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { createGroupServerSchema } from '@/lib/schemas';
import { createDefaultGroupRolePrivileges } from '@/lib/group-permissions';

/**
 * POST /api/prisma/group/create
 *
 * Creates a new private group. The authenticated user becomes the creator
 * and is automatically added as the first member.
 */
export async function POST(request: NextRequest) {
  try {
    // ── 1. Authenticate ──────────────────────────────────────────────
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // ── 2. Validate ──────────────────────────────────────────────────
    const body = await request.json();
    const parsed = createGroupServerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // ── 3. Check user exists in DB ───────────────────────────────────
    const dbUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found. Complete onboarding first.' },
        { status: 404 }
      );
    }

    // ── 4. Check for duplicate name ──────────────────────────────────
    const existing = await prisma.privateGroup.findUnique({
      where: { name: parsed.data.name },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A group with this name already exists' },
        { status: 409 }
      );
    }

    // ── 5. Create group + add creator as member ──────────────────────
    const group = await prisma.privateGroup.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        creatorId: dbUser.id,
        rolePrivileges: createDefaultGroupRolePrivileges(),
        members: { connect: { id: dbUser.id } },
        groupMemberships: {
          create: {
            userId: dbUser.id,
            role: 'OWNER',
          },
        },
      },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        members: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        groupMemberships: {
          select: { userId: true, role: true, joinedAt: true },
        },
        _count: { select: { members: true, memories: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Group created successfully',
      data: group,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[group/create] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
