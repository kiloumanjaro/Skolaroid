import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import {
  normaliseGroupRolePrivileges,
  resolveGroupMemberRole,
} from '@/lib/group-permissions';
import { updateGroupServerSchema } from '@/lib/schemas';

/**
 * GET /api/prisma/group/[groupId]
 *
 * Returns a single private group by id. Only members can view the group.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;

    // ── 1. Authenticate ──────────────────────────────────────────────
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // ── 2. Fetch group ───────────────────────────────────────────────
    const group = await prisma.privateGroup.findUnique({
      where: { id: groupId, deletedAt: null },
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

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // ── 3. Check membership ──────────────────────────────────────────
    const isMember = group.members.some((m) => m.id === authUser.id);
    if (!isMember) {
      return NextResponse.json(
        { error: 'You are not a member of this group' },
        { status: 403 }
      );
    }

    const membershipByUser = new Map(
      group.groupMemberships.map((membership) => [
        membership.userId,
        membership,
      ])
    );

    const members = group.members.map((member) => {
      const membership = membershipByUser.get(member.id);
      const role = resolveGroupMemberRole(
        member.id,
        group.creatorId,
        membership?.role
      );

      return {
        ...member,
        role,
        joinedAt: (membership?.joinedAt ?? group.createdAt).toISOString(),
      };
    });

    const currentUserRole = resolveGroupMemberRole(
      authUser.id,
      group.creatorId,
      membershipByUser.get(authUser.id)?.role
    );

    return NextResponse.json({
      success: true,
      data: {
        ...group,
        rolePrivileges: normaliseGroupRolePrivileges(group.rolePrivileges),
        currentUserRole,
        members,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[group/get] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/prisma/group/[groupId]
 *
 * Updates a group's name, description, or message. Only the group creator
 * (owner) is allowed to perform this action.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;

    // ── 1. Authenticate ──────────────────────────────────────────────
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // ── 2. Fetch group & verify ownership ────────────────────────────
    const group = await prisma.privateGroup.findUnique({
      where: { id: groupId, deletedAt: null },
      select: { creatorId: true, name: true },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (group.creatorId !== authUser.id) {
      return NextResponse.json(
        { error: 'Only the group owner can update settings' },
        { status: 403 }
      );
    }

    // ── 3. Validate body ─────────────────────────────────────────────
    const body = await request.json();
    const parsed = updateGroupServerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      );
    }

    const { name, description, message } = parsed.data;

    // ── 4. Check name uniqueness if changing ─────────────────────────
    if (name && name !== group.name) {
      const existing = await prisma.privateGroup.findFirst({
        where: { name, deletedAt: null, id: { not: groupId } },
      });
      if (existing) {
        return NextResponse.json(
          { error: 'A group with that name already exists' },
          { status: 409 }
        );
      }
    }

    // ── 5. Update ────────────────────────────────────────────────────
    const updated = await prisma.privateGroup.update({
      where: { id: groupId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(message !== undefined && { message }),
      },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        members: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        _count: { select: { members: true, memories: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Group updated successfully',
      data: updated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[group/patch] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
