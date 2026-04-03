import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { updateGroupRolePrivilegesSchema } from '@/lib/schemas';
import {
  normaliseGroupRolePrivileges,
  resolveGroupMemberRole,
} from '@/lib/group-permissions';

async function getGroupForPrivileges(groupId: string, userId: string) {
  return prisma.privateGroup.findUnique({
    where: { id: groupId, deletedAt: null },
    select: {
      id: true,
      creatorId: true,
      rolePrivileges: true,
      members: {
        where: { id: userId },
        select: { id: true },
      },
      groupMemberships: {
        where: { userId },
        select: { role: true },
      },
    },
  });
}

/**
 * GET /api/prisma/group/[groupId]/privileges
 *
 * Returns role privilege configuration for a group member.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;

    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const group = await getGroupForPrivileges(groupId, authUser.id);

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (group.members.length === 0) {
      return NextResponse.json(
        { error: 'You are not a member of this group' },
        { status: 403 }
      );
    }

    const currentUserRole = resolveGroupMemberRole(
      authUser.id,
      group.creatorId,
      group.groupMemberships[0]?.role
    );

    return NextResponse.json({
      success: true,
      data: {
        currentUserRole,
        rolePrivileges: normaliseGroupRolePrivileges(group.rolePrivileges),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[group/privileges/get] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/prisma/group/[groupId]/privileges
 *
 * Updates role privilege configuration. Only the owner can update this map.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;

    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateGroupRolePrivilegesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const group = await getGroupForPrivileges(groupId, authUser.id);

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (group.members.length === 0) {
      return NextResponse.json(
        { error: 'You are not a member of this group' },
        { status: 403 }
      );
    }

    const currentUserRole = resolveGroupMemberRole(
      authUser.id,
      group.creatorId,
      group.groupMemberships[0]?.role
    );

    if (currentUserRole !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only the group owner can configure role privileges' },
        { status: 403 }
      );
    }

    const rolePrivileges = normaliseGroupRolePrivileges(parsed.data.privileges);

    await prisma.privateGroup.update({
      where: { id: groupId },
      data: { rolePrivileges },
    });

    return NextResponse.json({
      success: true,
      message: 'Role privileges updated successfully',
      data: {
        currentUserRole,
        rolePrivileges,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[group/privileges/update] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
