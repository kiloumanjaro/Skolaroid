'use client';

import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  targetMemoryId: string | null;
  targetReportId: string | null;
  reason: string | null;
  read: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  success: boolean;
  data: {
    items: Notification[];
    nextCursor: string | null;
    hasMore: boolean;
  };
}

interface UnreadCountResponse {
  success: boolean;
  data: { count: number };
}

interface MarkReadResponse {
  success: boolean;
  message: string;
  data: { updatedCount: number };
}

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const params = new URLSearchParams();
      if (pageParam) params.set('cursor', pageParam);
      params.set('limit', '20');

      const res = await fetch(
        `/api/prisma/notification/get?${params.toString()}`
      );
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json() as Promise<NotificationsResponse>;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.data.nextCursor ?? undefined,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await fetch('/api/prisma/notification/unread-count');
      if (!res.ok) throw new Error('Failed to fetch unread count');
      const json = (await res.json()) as UnreadCountResponse;
      return json.data.count;
    },
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationIds: string[]) => {
      const res = await fetch('/api/prisma/notification/mark-read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds }),
      });
      if (!res.ok) throw new Error('Failed to mark notifications as read');
      return res.json() as Promise<MarkReadResponse>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
