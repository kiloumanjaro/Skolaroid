import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import {
  canRoleUsePermission,
  resolveGroupMemberRole,
} from '@/lib/group-permissions';

const INVITATION_EXPIRY_DAYS = 7;

const createInvitationLinkSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
});

/**
 * TEMPORARY PATCH:
 * This endpoint exists so invitation links can work right now for role-privilege
 * verification while the invitation system is still being finalized.
 *
 * It keeps the existing invitation system untouched and only adds a link-only
 * token generation path.
 */
export async function POST(request: NextRequest) {
  try {
    // ── 1. Authenticate ──────────────────────────────────────────────
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // ── 2. Validate ──────────────────────────────────────────────────
    const body = await request.json();
    const parsed = createInvitationLinkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { groupId } = parsed.data;

    // ── 3. Authorise actor by current role privileges ────────────────
    const group = await prisma.privateGroup.findUnique({
      where: { id: groupId, deletedAt: null },
      select: {
        id: true,
        creatorId: true,
        rolePrivileges: true,
        members: {
          where: { id: authUser.id },
          select: { id: true },
        },
        groupMemberships: {
          where: { userId: authUser.id },
          select: { role: true },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (group.members.length === 0) {
      return NextResponse.json(
        { error: 'You are not a member of this group' },
        { status: 403 }
      );
    }

    const actorRole = resolveGroupMemberRole(
      authUser.id,
      group.creatorId,
      group.groupMemberships[0]?.role
    );

    if (
      !canRoleUsePermission(group.rolePrivileges, actorRole, 'sendInvitations')
    ) {
      return NextResponse.json(
        { error: 'Your role cannot send invitations' },
        { status: 403 }
      );
    }

    // ── 4. Create invitation token ───────────────────────────────────
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

    const invitation = await prisma.invitation.create({
      data: {
        groupId,
        invitedBy: authUser.id,
        // Keep the current schema intact: invitation requires an email.
        // For link-only generation, we store the actor email as audit metadata.
        email:
          authUser.email?.toLowerCase() ?? 'temporary-link@skolaroid.local',
        token: crypto.randomBytes(32).toString('hex'),
        expiresAt,
      },
      select: {
        id: true,
        token: true,
        expiresAt: true,
      },
    });

    const origin = request.headers.get('origin') ?? request.nextUrl.origin;

    return NextResponse.json({
      success: true,
      data: {
        id: invitation.id,
        inviteLink: `${origin}/invite?token=${invitation.token}`,
        expiresAt: invitation.expiresAt.toISOString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[invitation/link] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
