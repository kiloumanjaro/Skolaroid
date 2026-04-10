import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { invitationActionSchema } from '@/lib/schemas';

/**
 * POST /api/prisma/invitation/accept
 *
 * Accepts an invitation: adds the user to the group and deletes the
 * invitation record. Requires authentication.
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
    const parsed = invitationActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // ── 3. Find invitation ───────────────────────────────────────────
    const invitation = await prisma.invitation.findUnique({
      where: { token: parsed.data.token },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            deletedAt: true,
            members: { select: { id: true } },
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation link' },
        { status: 404 }
      );
    }

    // ── 4. Check expiry ──────────────────────────────────────────────
    if (new Date() > invitation.expiresAt) {
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 410 }
      );
    }

    // ── 5. Check if group was deleted ────────────────────────────────
    if (invitation.group.deletedAt) {
      return NextResponse.json(
        { error: 'This group no longer exists' },
        { status: 410 }
      );
    }

    // ── 6. Check if user exists in DB ────────────────────────────────
    const dbUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { id: true, email: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found. Complete onboarding first.' },
        { status: 404 }
      );
    }

    // ── 6b. Verify token belongs to the authenticated user ──────────
    if (
      invitation.email &&
      dbUser.email.toLowerCase() !== invitation.email.toLowerCase()
    ) {
      return NextResponse.json(
        { error: 'Invalid invitation link' },
        { status: 403 }
      );
    }

    // ── 7. Check if already a member ─────────────────────────────────
    const isMember = invitation.group.members.some((m) => m.id === authUser.id);

    if (isMember) {
      // Already a member — just delete the invitation and return
      await prisma.invitation.delete({ where: { id: invitation.id } });
      return NextResponse.json({
        success: true,
        message: 'You are already a member of this group',
        alreadyMember: true,
      });
    }

    // ── 8. Add member and delete invitation atomically ───────────────
    await prisma.$transaction([
      prisma.privateGroup.update({
        where: { id: invitation.group.id },
        data: {
          members: { connect: { id: dbUser.id } },
          groupMemberships: {
            upsert: {
              where: {
                groupId_userId: {
                  groupId: invitation.group.id,
                  userId: dbUser.id,
                },
              },
              create: {
                userId: dbUser.id,
                role: 'MEMBER',
              },
              update: {},
            },
          },
        },
      }),
      prisma.invitation.delete({ where: { id: invitation.id } }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Joined "${invitation.group.name}" successfully`,
      groupId: invitation.group.id,
      groupName: invitation.group.name,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[invitation/accept] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
