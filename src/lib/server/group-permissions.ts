import { prisma } from '@/lib/prisma';
import {
  canRoleUsePermission,
  resolveGroupMemberRole,
} from '@/lib/group-permissions';

export async function assertCanPostInGroup(
  actorId: string,
  privateGroupId: string
): Promise<void> {
  const group = await prisma.privateGroup.findUnique({
    where: { id: privateGroupId, deletedAt: null },
    select: {
      id: true,
      creatorId: true,
      rolePrivileges: true,
      members: {
        where: { id: actorId },
        select: { id: true },
      },
      groupMemberships: {
        where: { userId: actorId },
        select: { role: true },
      },
    },
  });

  if (!group) {
    throw new Error('Group not found');
  }

  const isMember =
    group.members.length > 0 || group.groupMemberships.length > 0;

  if (!isMember) {
    throw new Error('You are not a member of this group');
  }

  const role = resolveGroupMemberRole(
    actorId,
    group.creatorId,
    group.groupMemberships[0]?.role
  );

  if (!canRoleUsePermission(group.rolePrivileges, role, 'editContent')) {
    throw new Error('Your role cannot post in this group');
  }
}
