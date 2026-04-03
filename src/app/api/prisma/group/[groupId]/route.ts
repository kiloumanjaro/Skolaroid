import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import {
  normaliseGroupRolePrivileges,
  resolveGroupMemberRole,
} from '@/lib/group-permissions';

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
