import { z } from 'zod';
import type { GroupRolePrivileges } from '@/lib/group-permissions';

// ─── GROUP ENUMS ────────────────────────────────────────────────────

export type GroupPrivacy = 'PUBLIC' | 'PRIVATE';
export type GroupVisibility = 'VISIBLE' | 'HIDDEN';

// The role a user has within a group
export type GroupMemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

// ─── INTERFACES ─────────────────────────────────────────────────────

// A member within a group
export interface GroupMember {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: GroupMemberRole;
  joinedAt: string; // ISO date string
}

// Full group shape (returned from API / used throughout the UI)
export interface Group {
  id: string;
  name: string;
  description?: string | null;
  message?: string | null;
  privacy: GroupPrivacy;
  visibility: GroupVisibility;
  coverPhotoUrl?: string | null;
  memberCount: number;
  postCount: number;
  ownerId: string;
  members: GroupMember[];
  rolePrivileges?: GroupRolePrivileges;
  currentUserRole?: GroupMemberRole;
  createdAt: string; // ISO date string
}

// Payload sent to create a group
export interface CreateGroupPayload {
  name: string;
  description?: string;
  privacy: GroupPrivacy;
  visibility: GroupVisibility;
  inviteEmails: string[];
}

// ─── ZOD VALIDATION SCHEMA ──────────────────────────────────────────

export const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Group name is required')
    .max(100, 'Group name must be 100 characters or less'),
  description: z
    .string()
    .trim()
    .max(500, 'Description must be 500 characters or less')
    .optional(),
  privacy: z.enum(['PUBLIC', 'PRIVATE']),
  visibility: z.enum(['VISIBLE', 'HIDDEN']),
  inviteEmails: z.string().trim(), // raw comma-separated string, validated loosely
});

export type CreateGroupFormData = z.infer<typeof createGroupSchema>;
