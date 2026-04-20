'use client';

import { useQuery } from '@tanstack/react-query';

export interface CurrentUserProfile {
  id: string;
  email: string;
  studentId: string;
  firstName: string;
  lastName: string;
  status: 'STUDENT' | 'ALUMNI';
  role: 'USER' | 'ADMIN';
  bio?: string | null;
  phone?: string | null;
  linkedinUrl?: string | null;
  facebookUrl?: string | null;
  contactOther?: string | null;
  avatarUrl?: string | null;
  programBatch: {
    id: string;
    program: { id: string; name: string };
    batch: { id: string; year: number };
  };
}

interface CurrentUserResponse {
  success: boolean;
  data: CurrentUserProfile | null;
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const res = await fetch('/api/prisma/user/get-current');
      if (!res.ok) throw new Error('Failed to fetch current user');
      return res.json() as Promise<CurrentUserResponse>;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
