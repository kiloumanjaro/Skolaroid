/**
 * Pure transforms used by GroupPanel.tsx to map raw API responses into the
 * frontend Group / GroupMember shapes. Extracted so the panel can stay focused
 * on rendering and modal orchestration.
 */

import { type Group, type GroupMember } from '@/lib/types/group';
import {
  type GroupResponse,
  type GroupMembershipResponse,
  type GroupMemberResponse,
} from '@/lib/hooks/useCreateGroup';
import { normaliseGroupRolePrivileges } from '@/lib/group-permissions';

/** Transform an API member response to the frontend GroupMember shape. */
export function toGroupMember(
  m: GroupMemberResponse,
  creatorId: string | null,
  membership?: GroupMembershipResponse
): GroupMember {
  return {
    id: m.id,
    name: `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() || m.email,
    email: m.email,
    role:
      m.role ??
      (m.id === creatorId
        ? ('OWNER' as const)
        : (membership?.role ?? 'MEMBER')),
    joinedAt: m.joinedAt ?? membership?.joinedAt ?? new Date().toISOString(),
  };
}

/** Transform an API GroupResponse to the frontend Group shape. */
export function toGroup(g: GroupResponse): Group {
  const membershipByUser = new Map(
    (g.groupMemberships ?? []).map((membership) => [
      membership.userId,
      membership,
    ])
  );

  return {
    id: g.id,
    name: g.name,
    description: g.description ?? undefined,
    message: g.message ?? undefined,
    privacy: 'PRIVATE',
    visibility: 'VISIBLE',
    coverPhotoUrl: undefined,
    memberCount: g._count.members,
    postCount: g._count.memories,
    ownerId: g.creatorId ?? '',
    members: g.members.map((m) =>
      toGroupMember(m, g.creatorId, membershipByUser.get(m.id))
    ),
    rolePrivileges: normaliseGroupRolePrivileges(g.rolePrivileges),
    currentUserRole: g.currentUserRole,
    createdAt: g.createdAt,
  };
}
