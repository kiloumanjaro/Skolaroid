import { prisma } from '@/lib/prisma';

export const GROUP_ROLES = ['OWNER', 'ADMIN', 'MEMBER'] as const;
export type GroupMemberRole = (typeof GROUP_ROLES)[number];

export const GROUP_PERMISSION_KEYS = [
  'editContent',
  'manageMembers',
  'viewAnalytics',
  'sendInvitations',
] as const;

export type GroupPermissionKey = (typeof GROUP_PERMISSION_KEYS)[number];

export type RolePermissionSet = Record<GroupPermissionKey, boolean>;
export type GroupRolePrivileges = Record<GroupMemberRole, RolePermissionSet>;

const DEFAULT_PRIVILEGES: GroupRolePrivileges = {
  OWNER: {
    editContent: true,
    manageMembers: true,
    viewAnalytics: true,
    sendInvitations: true,
  },
  ADMIN: {
    editContent: true,
    manageMembers: true,
    viewAnalytics: true,
    sendInvitations: true,
  },
  MEMBER: {
    editContent: true,
    manageMembers: false,
    viewAnalytics: false,
    sendInvitations: false,
  },
};

export function createDefaultGroupRolePrivileges(): GroupRolePrivileges {
  return {
    OWNER: { ...DEFAULT_PRIVILEGES.OWNER },
    ADMIN: { ...DEFAULT_PRIVILEGES.ADMIN },
    MEMBER: { ...DEFAULT_PRIVILEGES.MEMBER },
  };
}

function isGroupRole(value: unknown): value is GroupMemberRole {
  return (
    typeof value === 'string' && GROUP_ROLES.includes(value as GroupMemberRole)
  );
}

export function normaliseGroupRolePrivileges(
  value: unknown
): GroupRolePrivileges {
  const normalised = createDefaultGroupRolePrivileges();

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return normalised;
  }

  for (const role of GROUP_ROLES) {
    const sourceRole = (value as Record<string, unknown>)[role];
    if (
      !sourceRole ||
      typeof sourceRole !== 'object' ||
      Array.isArray(sourceRole)
    ) {
      continue;
    }

    for (const permission of GROUP_PERMISSION_KEYS) {
      const permissionValue = (sourceRole as Record<string, unknown>)[
        permission
      ];
      if (typeof permissionValue === 'boolean') {
        normalised[role][permission] = permissionValue;
      }
    }
  }

  // Owners always keep critical capabilities to prevent lock-out.
  normalised.OWNER.manageMembers = true;
  normalised.OWNER.sendInvitations = true;

  return normalised;
}

export function canRoleUsePermission(
  rolePrivileges: unknown,
  role: GroupMemberRole,
  permission: GroupPermissionKey
): boolean {
  const normalised = normaliseGroupRolePrivileges(rolePrivileges);
  return normalised[role][permission];
}

export function resolveGroupMemberRole(
  userId: string,
  creatorId: string | null,
  membershipRole: unknown
): GroupMemberRole {
  if (creatorId && creatorId === userId) {
    return 'OWNER';
  }

  if (isGroupRole(membershipRole)) {
    return membershipRole;
  }

  return 'MEMBER';
}

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
