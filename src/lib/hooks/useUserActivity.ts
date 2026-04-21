'use client';

import { useQuery } from '@tanstack/react-query';

export type ActivityItemType = 'upload' | 'vote' | 'comment';

export interface ActivityMemory {
  id: string;
  title: string;
  mediaURL?: string | null;
  mediaURLs?: string[];
  visibility: string;
  creatorId?: string | null;
  privateGroupId?: string | null;
  location: { buildingName: string; latitude: number; longitude: number };
  _count: { votes: number; comments: number };
  tags?: { id: string; name: string }[];
  creator?: {
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  } | null;
}

export interface ActivityItem {
  id: string;
  type: ActivityItemType;
  createdAt: string;
  commentContent?: string;
  memory: ActivityMemory;
}

interface ActivityResponse {
  success: boolean;
  message: string;
  data: ActivityItem[];
  nextCursor: string | null;
}

interface UseUserActivityParams {
  userId: string | undefined;
  type?: ActivityItemType;
  limit?: number;
}

export function useUserActivity({
  userId,
  type,
  limit = 20,
}: UseUserActivityParams) {
  return useQuery({
    queryKey: ['user-activity', userId, type ?? 'all', limit],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      const params = new URLSearchParams({ userId, limit: String(limit) });
      if (type) params.set('type', type);
      const res = await fetch(
        `/api/prisma/user/activity/get?${params.toString()}`
      );
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(
          json?.message ?? `Failed to fetch activity (${res.status})`
        );
      }
      const data = await res.json();
      if (!data.success)
        throw new Error(data.message ?? 'Failed to fetch activity');
      return data as ActivityResponse;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
}
