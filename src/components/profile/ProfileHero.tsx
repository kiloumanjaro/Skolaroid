'use client';

import type { User } from '@supabase/supabase-js';
import Image from 'next/image';
import {
  GraduationCap,
  Mail,
  ShieldCheck,
  SquarePen,
  User as UserIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CurrentUserProfile } from '@/lib/hooks/useCurrentUser';
import {
  ProfileStatTile,
  profileFlatButtonClass,
} from '@/components/profile/profile-shell';

interface ProfileHeroProps {
  user: User | null;
  dbUser?: CurrentUserProfile | null;
  onEditClick: () => void;
}

export function ProfileHero({ user, dbUser, onEditClick }: ProfileHeroProps) {
  const avatarUrl =
    user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const displayName = dbUser
    ? `${dbUser.firstName} ${dbUser.lastName}`.trim()
    : user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email ||
      'Unknown User';
  const email = user?.email;
  const programName = dbUser?.programBatch.program.name ?? 'Program pending';
  const batchLabel = dbUser?.programBatch.batch.year
    ? `Batch ${dbUser.programBatch.batch.year}`
    : 'Batch pending';
  const memberStatus =
    dbUser?.status === 'ALUMNI'
      ? 'Alumni'
      : dbUser?.status === 'STUDENT'
        ? 'Student'
        : 'Profile setup';
  const roleLabel = dbUser?.role === 'ADMIN' ? 'Admin access' : 'Member';

  return (
    <section className="overflow-hidden border-2 border-border bg-card shadow-none">
      <div className="border-b-2 border-border bg-[#fff4a8] px-5 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-foreground/75">
          Profile Board
        </p>
      </div>
      <div className="grid lg:grid-cols-[240px_minmax(0,1fr)]">
        <div className="flex flex-col items-center gap-4 border-b-2 border-border bg-[#c0f7fe] p-6 text-center lg:border-b-0 lg:border-r-2">
          <div className="relative border-2 border-border bg-card p-3">
            <div className="absolute -right-2 -top-2 border-2 border-border bg-[#fff4a8] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground">
              ID
            </div>
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={128}
                height={128}
                className="h-32 w-32 object-cover"
              />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center bg-card text-foreground">
                <UserIcon className="h-12 w-12" />
              </div>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/65">
              Archived Identity
            </p>
            <p className="font-kalam text-lg font-bold text-foreground">
              {memberStatus}
            </p>
          </div>
        </div>

        <div className="flex flex-col p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-foreground/60">
                Student Profile
              </p>
              <h1 className="mt-2 break-words font-kalam text-3xl font-bold leading-none text-foreground sm:text-4xl">
                {displayName}
              </h1>
              {email && (
                <div className="mt-4 flex items-center gap-2 text-sm text-foreground/75">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="truncate">{email}</span>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <div className="border-2 border-border bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-foreground">
                  {memberStatus}
                </div>
                <div className="border-2 border-border bg-[#ffe3b3] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-foreground">
                  {batchLabel}
                </div>
                <div className="border-2 border-border bg-[#d6f5df] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-foreground">
                  {programName}
                </div>
                {dbUser?.role === 'ADMIN' ? (
                  <div className="border-2 border-border bg-[#ffd7e5] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-foreground">
                    Moderator
                  </div>
                ) : null}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onEditClick}
              className={profileFlatButtonClass}
              style={{ borderRadius: 0 }}
            >
              <SquarePen className="h-4 w-4" />
              Edit Profile
            </Button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ProfileStatTile label="Program" value={programName} />
            <ProfileStatTile
              label="Batch"
              value={batchLabel}
              className="bg-[#fffaf0]"
            />
            <ProfileStatTile
              label="Status"
              value={
                <span className="inline-flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  {memberStatus}
                </span>
              }
              className="bg-[#f7fff6]"
            />
            <ProfileStatTile
              label="Access"
              value={
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  {roleLabel}
                </span>
              }
              className="bg-[#fff8fb]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
