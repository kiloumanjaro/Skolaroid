'use client';

import type { User } from '@supabase/supabase-js';
import Image from 'next/image';
import { User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CurrentUserProfile } from '@/lib/hooks/useCurrentUser';

interface ProfileHeroProps {
  user: User | null;
  dbUser?: CurrentUserProfile | null;
}

export function ProfileHero({ user, dbUser }: ProfileHeroProps) {
  const avatarUrl =
    user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const displayName = dbUser
    ? `${dbUser.firstName} ${dbUser.lastName}`
    : user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email ||
      'Unknown User';
  const email = user?.email;

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border bg-card p-8 text-center shadow sm:flex-row sm:text-left">
      <div className="shrink-0">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            width={96}
            height={96}
            className="h-24 w-24 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-[3px] border-foreground bg-card text-foreground">
            <UserIcon className="h-10 w-10" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 sm:gap-2">
        <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
        {email && <p className="text-sm text-muted-foreground">{email}</p>}
        {dbUser && (
          <p className="text-xs text-muted-foreground">
            {dbUser.status === 'ALUMNI' ? 'Alumni' : 'Student'} · Batch{' '}
            {dbUser.programBatch.batch.year}
          </p>
        )}
      </div>
      <div className="shrink-0">
        <Button
          variant="outline"
          size="sm"
          disabled
          className="cursor-not-allowed opacity-50"
        >
          Edit Profile
        </Button>
      </div>
    </div>
  );
}
