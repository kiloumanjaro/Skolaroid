import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const signUpSchema = z
  .object({
    fullName: z.string().min(1, 'Full name is required'),
    email: z.string().email('Invalid alumni email address'),
    studentId: z.string().min(1, 'Student ID is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const updatePasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// ============================================================================
// MEMORY CONSTANTS
// ============================================================================

export const MAX_TAGS = 10;
export const MAX_TAG_SUGGESTIONS = 5;

// ============================================================================
// MEMORY SCHEMAS
// ============================================================================

export const memoryVisibilityEnum = z.enum([
  'PUBLIC',
  'PROGRAM_ONLY',
  'BATCH_ONLY',
  'GROUP_ONLY',
  'PRIVATE',
]);

/** Schema for creating a memory — used by the form (client-side). */
export const createMemorySchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(255, 'Title must be 255 characters or less'),
  description: z
    .string()
    .trim()
    .max(5000, 'Description is too long')
    .optional(),
  visibility: memoryVisibilityEnum.default('PUBLIC'),
  locationId: z.string().min(1, 'Location is required'), // change to uuid later
  memoryDate: z.string().datetime().optional(),
  tags: z
    .array(z.string().trim().min(1).max(50))
    .max(MAX_TAGS, 'Maximum 10 tags')
    .optional(),
  privateGroupId: z.string().uuid('Invalid group ID').optional(),
});

/** Server-side schema — same fields sent over the wire (no File objects). */
export const createMemoryServerSchema = createMemorySchema.extend({
  programBatchId: z.string().min(1, 'Program batch is required'), // change to uuid later
  mediaURL: z.string().url('Invalid media URL').optional(),
  memoryDate: z.coerce.date().optional(),
  privateGroupId: z.string().uuid('Invalid group ID').optional(),
});

/** Schema for updating tags on an existing memory. */
export const updateMemoryTagsSchema = z.object({
  memoryId: z.string().uuid('Invalid memory ID'),
  tags: z
    .array(z.string().trim().min(1).max(50))
    .max(MAX_TAGS, 'Maximum 10 tags'),
});

/** Schema for querying memories by location. */
export const memoriesByLocationQuerySchema = z.object({
  locationId: z.string().uuid('Invalid location ID'),
});

/** Schema for querying memories by creator. */
export const memoriesByCreatorQuerySchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

// ============================================================================
// VOTE SCHEMAS
// ============================================================================

/** Payload for toggling a vote — userId comes from server-side auth, never the client. */
export const toggleVoteSchema = z.object({
  memoryId: z.string().uuid('Invalid memory ID'),
});

/** Query params for fetching vote status on a single memory. */
export const voteStatusQuerySchema = z.object({
  memoryId: z.string().uuid('Invalid memory ID'),
});

export type ToggleVoteInput = z.infer<typeof toggleVoteSchema>;
export type VoteStatusQuery = z.infer<typeof voteStatusQuerySchema>;

// ============================================================================
// COMMENT SCHEMAS
// ============================================================================

export const MAX_COMMENT_LENGTH = 2000;

/** Payload for creating a comment — authorId comes from server-side auth. */
export const createCommentSchema = z.object({
  memoryId: z.string().uuid('Invalid memory ID'),
  content: z
    .string()
    .trim()
    .min(1, 'Comment cannot be empty')
    .max(
      MAX_COMMENT_LENGTH,
      `Comment must be ${MAX_COMMENT_LENGTH} characters or less`
    ),
});

/** Query params for fetching comments on a memory (cursor-based pagination). */
export const getCommentsQuerySchema = z.object({
  memoryId: z.string().uuid('Invalid memory ID'),
  cursor: z.string().uuid('Invalid cursor').optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

/** Payload for deleting a comment — checked against authorId server-side. */
export const deleteCommentSchema = z.object({
  commentId: z.string().uuid('Invalid comment ID'),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type GetCommentsQuery = z.infer<typeof getCommentsQuerySchema>;
export type DeleteCommentInput = z.infer<typeof deleteCommentSchema>;

// ============================================================================
// MEMORY TYPE EXPORTS
// ============================================================================

export type MemoryVisibility = z.infer<typeof memoryVisibilityEnum>;
export type CreateMemoryInput = z.infer<typeof createMemorySchema>;
export type CreateMemoryServerInput = z.infer<typeof createMemoryServerSchema>;
export type UpdateMemoryTagsInput = z.infer<typeof updateMemoryTagsSchema>;

// ============================================================================
// ONBOARDING / USER CREATION SCHEMAS
// ============================================================================

export const statusEnum = z.enum(['STUDENT', 'ALUMNI'], {
  error: 'Status must be either STUDENT or ALUMNI',
});

/** Payload sent by the onboarding page to create the User row. */
export const onboardUserSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'First name is required')
    .max(100, 'First name must be 100 characters or less')
    .regex(
      /^[a-zA-Z]+( [a-zA-Z]+)*$/,
      'First name can only contain letters with single spaces between words'
    ),
  lastName: z
    .string()
    .trim()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be 100 characters or less')
    .regex(
      /^[a-zA-Z]+( [a-zA-Z]+)*$/,
      'Last name can only contain letters with single spaces between words'
    ),
  batchYear: z
    .number({ error: 'Batch year must be a number' })
    .int('Batch year must be a whole number')
    .min(1900, 'Batch year must be 1900 or later')
    .max(new Date().getFullYear(), 'Batch year cannot be in the future'),
  programName: z.string().trim().min(1, 'Program is required'),
  studentId: z
    .string()
    .trim()
    .regex(
      /^\d{4}-\d{5}$/,
      'Student ID must follow the format YYYY-NNNNN (e.g. 2023-00981)'
    ),
  status: statusEnum,
});

export type OnboardUserInput = z.infer<typeof onboardUserSchema>;

// ============================================================================
// SHARED TYPES
// ============================================================================

/** Shape returned by API for a memory with relations. Used by hooks and components. */
export interface MemoryWithRelations {
  id: string;
  title: string;
  description?: string | null;
  mediaURL?: string | null;
  visibility: MemoryVisibility;
  creatorId?: string | null;
  createdAt?: string;
  tags?: { id: string; name: string }[];
  location?: { buildingName: string };
  creator?: { firstName: string; lastName: string } | null;
  _count?: { votes: number; comments: number };
}

/** Visibility label mapping for display. */
export const VISIBILITY_LABELS: Record<MemoryVisibility, string> = {
  PUBLIC: 'Public',
  PROGRAM_ONLY: 'Program',
  BATCH_ONLY: 'Batch',
  GROUP_ONLY: 'Group',
  PRIVATE: 'Private',
};

// ============================================================================
// GROUP SCHEMAS
// ============================================================================

/** Schema for creating a private group. */
export const createGroupServerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Group name is required')
    .max(50, 'Group name must be 50 characters or less'),
  description: z
    .string()
    .trim()
    .max(500, 'Description must be 500 characters or less')
    .optional(),
});

/** Schema for updating a private group. */
export const updateGroupServerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Group name is required')
    .max(50, 'Group name must be 50 characters or less')
    .optional(),
  description: z
    .string()
    .trim()
    .max(500, 'Description must be 500 characters or less')
    .optional(),
  message: z
    .string()
    .trim()
    .max(300, 'Message must be 300 characters or less')
    .optional(),
});

/** Schema for adding/removing a member by email. */
export const groupMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type CreateGroupServerInput = z.infer<typeof createGroupServerSchema>;
export type UpdateGroupServerInput = z.infer<typeof updateGroupServerSchema>;
export type GroupMemberInput = z.infer<typeof groupMemberSchema>;

// ============================================================================
// INVITATION SCHEMAS
// ============================================================================

/** Schema for sending invitations — comma-separated emails. */
export const sendInvitationsSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
  emails: z
    .array(z.string().email('Invalid email address'))
    .min(1, 'At least one email is required')
    .max(20, 'Maximum 20 invitations at once'),
});

/** Schema for validating an invitation token. */
export const invitationTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

/** Schema for accepting/declining an invitation. */
export const invitationActionSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export type SendInvitationsInput = z.infer<typeof sendInvitationsSchema>;
export type InvitationTokenInput = z.infer<typeof invitationTokenSchema>;
export type InvitationActionInput = z.infer<typeof invitationActionSchema>;

// ============================================================================
// AUTH TYPE EXPORTS
// ============================================================================

export type LoginInput = z.infer<typeof loginSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
