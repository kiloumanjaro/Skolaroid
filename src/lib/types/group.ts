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

// ─── MOCK CURRENT USER ID ──────────────────────────────────────────
// Replace with actual auth user ID once backend is integrated
export const MOCK_CURRENT_USER_ID = 'user-001';

// ─── MOCK DATA ─────────────────────────────────────────────────────
// Replace with real API calls (TanStack Query hooks) in future sprints
export const MOCK_GROUPS: Group[] = [
  {
    id: 'group-001',
    name: 'BSCS Batch 2023',
    description:
      'Bachelor of Science in Computer Science — Batch 2023. A place for all BSCS 2023 alumni to reconnect and share memories.',
    privacy: 'PUBLIC',
    visibility: 'VISIBLE',
    coverPhotoUrl: null,
    memberCount: 42,
    postCount: 17,
    ownerId: 'user-001',
    createdAt: '2024-01-15T08:00:00.000Z',
    members: [
      {
        id: 'user-001',
        name: 'You (Owner)',
        email: 'you@example.com',
        avatarUrl: null,
        role: 'OWNER',
        joinedAt: '2024-01-15T08:00:00.000Z',
      },
      {
        id: 'user-002',
        name: 'Maria Santos',
        email: 'maria.santos@example.com',
        avatarUrl: null,
        role: 'ADMIN',
        joinedAt: '2024-01-16T09:00:00.000Z',
      },
      {
        id: 'user-003',
        name: 'Juan dela Cruz',
        email: 'juan.delacruz@example.com',
        avatarUrl: null,
        role: 'MEMBER',
        joinedAt: '2024-01-17T10:00:00.000Z',
      },
      {
        id: 'user-004',
        name: 'Ana Reyes',
        email: 'ana.reyes@example.com',
        avatarUrl: null,
        role: 'MEMBER',
        joinedAt: '2024-01-18T11:00:00.000Z',
      },
      {
        id: 'user-005',
        name: 'Carlos Mendoza',
        email: 'carlos.mendoza@example.com',
        avatarUrl: null,
        role: 'MEMBER',
        joinedAt: '2024-01-19T12:00:00.000Z',
      },
    ],
  },
  {
    id: 'group-002',
    name: 'BSIT Alumni 2022',
    description: 'IT Alumni group for the graduating batch of 2022.',
    privacy: 'PRIVATE',
    visibility: 'HIDDEN',
    coverPhotoUrl: null,
    memberCount: 28,
    postCount: 9,
    ownerId: 'user-002',
    createdAt: '2024-02-01T08:00:00.000Z',
    members: [
      {
        id: 'user-002',
        name: 'Maria Santos',
        email: 'maria.santos@example.com',
        avatarUrl: null,
        role: 'OWNER',
        joinedAt: '2024-02-01T08:00:00.000Z',
      },
      {
        id: 'user-001',
        name: 'You',
        email: 'you@example.com',
        avatarUrl: null,
        role: 'MEMBER',
        joinedAt: '2024-02-05T09:00:00.000Z',
      },
      {
        id: 'user-006',
        name: 'Pedro Ramos',
        email: 'pedro.ramos@example.com',
        avatarUrl: null,
        role: 'MEMBER',
        joinedAt: '2024-02-06T10:00:00.000Z',
      },
    ],
  },
];
