import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { createInvitationLinkSchema } from '@/lib/schemas';
import {
  canRoleUsePermission,
  resolveGroupMemberRole,
} from '@/lib/group-permissions';

const INVITATION_EXPIRY_DAYS = 7;

/**
 * POST /api/prisma/invitation/link
 *
 * Generates a public, multi-use invitation link for a group.
 * The link is not tied to a specific email and can be used by
 * anyone up to `maxUses` times.
 *
 * Requires sendInvitations privilege for the actor role.
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

    const { groupId, maxUses } = parsed.data;

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

    // ── 4. Create public invitation token ─────────────────────────────
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

    const invitation = await prisma.invitation.create({
      data: {
        groupId,
        invitedBy: authUser.id,
        email: null,
        token: crypto.randomBytes(32).toString('hex'),
        isForAll: true,
        maxUses,
        expiresAt,
      },
      select: {
        id: true,
        token: true,
        maxUses: true,
        expiresAt: true,
      },
    });

    const origin = request.headers.get('origin') ?? request.nextUrl.origin;

    return NextResponse.json({
      success: true,
      data: {
        id: invitation.id,
        inviteLink: `${origin}/invite?token=${invitation.token}`,
        maxUses: invitation.maxUses,
        expiresAt: invitation.expiresAt.toISOString(),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.stack || error.message : 'Unknown error';
    console.error('[invitation/link] Error:', message);
    return NextResponse.json({ error: String(message) }, { status: 500 });
  }
}
