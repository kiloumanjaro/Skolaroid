import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { groupMemberSchema, updateGroupMemberRoleSchema } from '@/lib/schemas';
import {
  canRoleUsePermission,
  normaliseGroupRolePrivileges,
  resolveGroupMemberRole,
} from '@/lib/group-permissions';

type GroupWithMembers = {
  id: string;
  creatorId: string | null;
  rolePrivileges: unknown;
  createdAt: Date;
  members: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  }[];
  groupMemberships: {
    userId: string;
    role: 'OWNER' | 'ADMIN' | 'MEMBER';
    joinedAt: Date;
  }[];
  _count: {
    members: number;
    memories: number;
  };
};

async function getGroupWithMembers(
  groupId: string
): Promise<GroupWithMembers | null> {
  return prisma.privateGroup.findUnique({
    where: { id: groupId, deletedAt: null },
    select: {
      id: true,
      creatorId: true,
      rolePrivileges: true,
      createdAt: true,
      members: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      groupMemberships: {
        select: { userId: true, role: true, joinedAt: true },
      },
      _count: { select: { members: true, memories: true } },
    },
  });
}

function toGroupResponse(group: GroupWithMembers) {
  const membershipByUser = new Map(
    group.groupMemberships.map((membership) => [membership.userId, membership])
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

  return {
    ...group,
    rolePrivileges: normaliseGroupRolePrivileges(group.rolePrivileges),
    members,
  };
}

/**
 * POST /api/prisma/group/[groupId]/members
 *
 * Adds a member to the group by email.
 * Requires manageMembers privilege for the actor role.
 */
export async function POST(
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

    // ── 2. Validate body ─────────────────────────────────────────────
    const body = await request.json();
    const parsed = groupMemberSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // ── 3. Fetch group ───────────────────────────────────────────────
    const group = await getGroupWithMembers(groupId);

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const isActorMember = group.members.some(
      (member) => member.id === authUser.id
    );
    if (!isActorMember) {
      return NextResponse.json(
        { error: 'You are not a member of this group' },
        { status: 403 }
      );
    }

    const actorRole = resolveGroupMemberRole(
      authUser.id,
      group.creatorId,
      group.groupMemberships.find(
        (membership) => membership.userId === authUser.id
      )?.role
    );

    if (
      !canRoleUsePermission(group.rolePrivileges, actorRole, 'manageMembers')
    ) {
      return NextResponse.json(
        { error: 'Your role cannot manage members' },
        { status: 403 }
      );
    }

    // ── 5. Find user by email ────────────────────────────────────────
    const targetUser = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'No user found with that email' },
        { status: 404 }
      );
    }

    const alreadyMember = group.members.some(
      (member) => member.id === targetUser.id
    );
    if (alreadyMember) {
      return NextResponse.json(
        { error: 'User is already a member of this group' },
        { status: 409 }
      );
    }

    // ── 6. Add member ────────────────────────────────────────────────
    const updated = await prisma.privateGroup.update({
      where: { id: groupId },
      data: {
        members: { connect: { id: targetUser.id } },
        groupMemberships: {
          upsert: {
            where: {
              groupId_userId: {
                groupId,
                userId: targetUser.id,
              },
            },
            create: {
              userId: targetUser.id,
              role: 'MEMBER',
            },
            update: {},
          },
        },
      },
      select: {
        id: true,
        creatorId: true,
        rolePrivileges: true,
        createdAt: true,
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
      message: 'Member added successfully',
      data: toGroupResponse(updated),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[group/members/add] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/prisma/group/[groupId]/members
 *
 * Removes a member from the group.
 * Members can remove themselves, and privileged roles can remove others.
 */
export async function DELETE(
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

    // ── 2. Validate body ─────────────────────────────────────────────
    const body = await request.json();
    const parsed = groupMemberSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // ── 3. Fetch group ───────────────────────────────────────────────
    const group = await getGroupWithMembers(groupId);

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const isActorMember = group.members.some(
      (member) => member.id === authUser.id
    );
    if (!isActorMember) {
      return NextResponse.json(
        { error: 'You are not a member of this group' },
        { status: 403 }
      );
    }

    const actorRole = resolveGroupMemberRole(
      authUser.id,
      group.creatorId,
      group.groupMemberships.find(
        (membership) => membership.userId === authUser.id
      )?.role
    );

    // ── 4. Find target user ──────────────────────────────────────────
    const targetUser = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'No user found with that email' },
        { status: 404 }
      );
    }

    const isTargetMember = group.members.some(
      (member) => member.id === targetUser.id
    );
    if (!isTargetMember) {
      return NextResponse.json(
        { error: 'User is not a member of this group' },
        { status: 404 }
      );
    }

    // ── 5. Authorise ─────────────────────────────────────────────────
    const isSelf = targetUser.id === authUser.id;

    if (
      !isSelf &&
      !canRoleUsePermission(group.rolePrivileges, actorRole, 'manageMembers')
    ) {
      return NextResponse.json(
        { error: 'Your role cannot manage members' },
        { status: 403 }
      );
    }

    // Prevent creator from removing themselves (they should delete the group)
    if (isSelf && actorRole === 'OWNER') {
      return NextResponse.json(
        { error: 'The group creator cannot leave. Delete the group instead.' },
        { status: 400 }
      );
    }

    const targetRole = resolveGroupMemberRole(
      targetUser.id,
      group.creatorId,
      group.groupMemberships.find(
        (membership) => membership.userId === targetUser.id
      )?.role
    );

    if (!isSelf && targetRole === 'OWNER') {
      return NextResponse.json(
        { error: 'The group owner cannot be removed' },
        { status: 403 }
      );
    }

    // ── 6. Remove member ─────────────────────────────────────────────
    await prisma.$transaction([
      prisma.privateGroup.update({
        where: { id: groupId },
        data: { members: { disconnect: { id: targetUser.id } } },
      }),
      prisma.groupMembership.deleteMany({
        where: {
          groupId,
          userId: targetUser.id,
        },
      }),
    ]);

    const updated = await getGroupWithMembers(groupId);
    if (!updated) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: isSelf ? 'You left the group' : 'Member removed successfully',
      data: toGroupResponse(updated),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[group/members/remove] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/prisma/group/[groupId]/members
 *
 * Updates the role of a member. Only the group owner can change roles.
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

    // ── 2. Validate body ─────────────────────────────────────────────
    const body = await request.json();
    const parsed = updateGroupMemberRoleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // ── 3. Fetch group and authorise ─────────────────────────────────
    const group = await getGroupWithMembers(groupId);

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const actorRole = resolveGroupMemberRole(
      authUser.id,
      group.creatorId,
      group.groupMemberships.find(
        (membership) => membership.userId === authUser.id
      )?.role
    );

    if (actorRole !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only the group owner can change member roles' },
        { status: 403 }
      );
    }

    // ── 4. Find target user ──────────────────────────────────────────
    const targetUser = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'No user found with that email' },
        { status: 404 }
      );
    }

    if (!group.members.some((member) => member.id === targetUser.id)) {
      return NextResponse.json(
        { error: 'User is not a member of this group' },
        { status: 404 }
      );
    }

    if (targetUser.id === group.creatorId) {
      return NextResponse.json(
        { error: 'The group owner role cannot be changed' },
        { status: 400 }
      );
    }

    // ── 5. Upsert membership role ────────────────────────────────────
    await prisma.groupMembership.upsert({
      where: {
        groupId_userId: {
          groupId,
          userId: targetUser.id,
        },
      },
      create: {
        groupId,
        userId: targetUser.id,
        role: parsed.data.role,
      },
      update: {
        role: parsed.data.role,
      },
    });

    const updated = await getGroupWithMembers(groupId);
    if (!updated) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Member role updated successfully',
      data: toGroupResponse(updated),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[group/members/update-role] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
