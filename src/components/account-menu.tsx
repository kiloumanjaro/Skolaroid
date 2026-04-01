'use client';

// Account menu component for user profile and logout
import { User, LogOut } from 'lucide-react';
import { useUserAuth } from '@/lib/hooks/useUserAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export function AccountMenu() {
  const { logout, user } = useUserAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const userAvatar =
    user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const userName =
    user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-full transition hover:opacity-80"
          aria-label="Account menu"
        >
          {userAvatar ? (
            <Image
              src={userAvatar}
              alt={userName || 'User avatar'}
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-skolaroid-blue text-white">
              <User className="h-4 w-4" />
            </div>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {userName && (
          <DropdownMenuItem onClick={() => router.push('/profile')}>
            <User className="mr-2 h-4 w-4" />
            <span>{userName}</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
