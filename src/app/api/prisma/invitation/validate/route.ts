import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/prisma/invitation/validate?token=TOKEN
 *
 * Validates an invitation token and returns the invitation + group info.
 * Checks: token exists, not expired, and whether the authenticated user
 * is already a member of the group.
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // ── 1. Find invitation ───────────────────────────────────────────
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        group: {
          include: {
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            members: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            _count: { select: { members: true, memories: true } },
          },
        },
        inviter: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation link', code: 'INVALID_TOKEN' },
        { status: 404 }
      );
    }

    // ── 2. Check expiry ──────────────────────────────────────────────
    if (new Date() > invitation.expiresAt) {
      return NextResponse.json(
        { error: 'This invitation has expired', code: 'EXPIRED' },
        { status: 410 }
      );
    }

    // ── 3. Check if group was deleted ────────────────────────────────
    if (invitation.group.deletedAt) {
      return NextResponse.json(
        { error: 'This group no longer exists', code: 'GROUP_DELETED' },
        { status: 410 }
      );
    }

    // ── 4. Check authentication ──────────────────────────────────────
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          code: 'NOT_AUTHENTICATED',
          groupName: invitation.group.name,
        },
        { status: 401 }
      );
    }

    // ── 5. Verify token belongs to the authenticated user ────────────
    if (
      invitation.email &&
      authUser.email?.toLowerCase() !== invitation.email.toLowerCase()
    ) {
      return NextResponse.json(
        {
          error: 'Invalid invitation link',
          code: 'WRONG_USER',
          groupName: invitation.group.name,
        },
        { status: 403 }
      );
    }

    // ── 6. Check if already a member ─────────────────────────────────
    const isMember = invitation.group.members.some((m) => m.id === authUser.id);

    return NextResponse.json({
      success: true,
      data: {
        invitation: {
          id: invitation.id,
          email: invitation.email,
          expiresAt: invitation.expiresAt.toISOString(),
          token: invitation.token,
        },
        group: {
          id: invitation.group.id,
          name: invitation.group.name,
          description: invitation.group.description,
          creator: invitation.group.creator,
          memberCount: invitation.group._count.members,
          memoryCount: invitation.group._count.memories,
        },
        inviter: {
          name: `${invitation.inviter.firstName ?? ''} ${invitation.inviter.lastName ?? ''}`.trim(),
        },
        alreadyMember: isMember,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[invitation/validate] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
