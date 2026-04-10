'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateGroupServerInput } from '@/lib/schemas';

export interface GroupMemberResponse {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role?: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt?: string;
}

export interface GroupMembershipResponse {
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
}

export interface GroupRolePrivilegesResponse {
  OWNER: {
    editContent: boolean;
    manageMembers: boolean;
    viewAnalytics: boolean;
    sendInvitations: boolean;
  };
  ADMIN: {
    editContent: boolean;
    manageMembers: boolean;
    viewAnalytics: boolean;
    sendInvitations: boolean;
  };
  MEMBER: {
    editContent: boolean;
    manageMembers: boolean;
    viewAnalytics: boolean;
    sendInvitations: boolean;
  };
}

export interface GroupResponse {
  id: string;
  name: string;
  description: string | null;
  message: string | null;
  creatorId: string | null;
  creator: GroupMemberResponse | null;
  members: GroupMemberResponse[];
  groupMemberships?: GroupMembershipResponse[];
  rolePrivileges?: GroupRolePrivilegesResponse;
  currentUserRole?: 'OWNER' | 'ADMIN' | 'MEMBER';
  _count: { members: number; memories: number };
  createdAt: string;
  updatedAt: string;
}

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: CreateGroupServerInput
    ): Promise<GroupResponse> => {
      const res = await fetch('/api/prisma/group/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Failed to create group');
      return body.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}
