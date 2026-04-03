'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// ─── TYPES ──────────────────────────────────────────────────────────

interface SendInvitationsResult {
  id: string;
  email: string;
  inviteLink: string;
  expiresAt: string;
}

interface CreateInvitationLinkResult {
  id: string;
  inviteLink: string;
  expiresAt: string;
}

export interface ValidateInvitationData {
  invitation: {
    id: string;
    email: string;
    expiresAt: string;
    token: string;
  };
  group: {
    id: string;
    name: string;
    description: string | null;
    creator: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string;
    } | null;
    memberCount: number;
    memoryCount: number;
  };
  inviter: {
    name: string;
  };
  alreadyMember: boolean;
}

interface ValidateInvitationError {
  error: string;
  code?: string;
  groupName?: string;
}

interface AcceptInvitationResult {
  success: boolean;
  message: string;
  groupId?: string;
  groupName?: string;
  alreadyMember?: boolean;
}

// ─── HOOKS ──────────────────────────────────────────────────────────

export function useSendInvitations() {
  return useMutation({
    mutationFn: async (data: {
      groupId: string;
      emails: string[];
    }): Promise<SendInvitationsResult[]> => {
      const res = await fetch('/api/prisma/invitation/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Failed to send invitations');
      return body.data;
    },
  });
}

/**
 * TEMPORARY PATCH:
 * Generates a tokenized invitation link for quick verification flows.
 * Existing invitation-by-email hooks remain unchanged.
 */
export function useCreateInvitationLink() {
  return useMutation({
    mutationFn: async (
      groupId: string
    ): Promise<CreateInvitationLinkResult> => {
      const res = await fetch('/api/prisma/invitation/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId }),
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error ?? 'Failed to generate invitation link');
      }

      return body.data;
    },
  });
}

export function useValidateInvitation(token: string | null) {
  return useQuery<ValidateInvitationData, ValidateInvitationError>({
    queryKey: ['invitation', 'validate', token],
    queryFn: async () => {
      const res = await fetch(
        `/api/prisma/invitation/validate?token=${encodeURIComponent(token!)}`
      );

      const body = await res.json();

      if (!res.ok) {
        const err: ValidateInvitationError = {
          error: body.error ?? 'Unknown error',
          code: body.code,
          groupName: body.groupName,
        };
        throw err;
      }

      return body.data;
    },
    enabled: !!token,
    retry: false,
    staleTime: 0,
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string): Promise<AcceptInvitationResult> => {
      const res = await fetch('/api/prisma/invitation/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Failed to accept invitation');
      return body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useDeclineInvitation() {
  return useMutation({
    mutationFn: async (
      token: string
    ): Promise<{ success: boolean; message: string }> => {
      const res = await fetch('/api/prisma/invitation/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const body = await res.json();
      if (!res.ok)
        throw new Error(body.error ?? 'Failed to decline invitation');
      return body;
    },
  });
}
