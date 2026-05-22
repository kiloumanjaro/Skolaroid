import { useQuery } from '@tanstack/react-query';

export interface ActiveEvent {
  id: string;
  name: string;
  description?: string | null;
  bannerColor: string;
  startAt: string;
  endAt: string;
  isActive: boolean;
  location: {
    id: string;
    buildingName: string;
    latitude: number;
    longitude: number;
  };
}

export function useActiveEvents() {
  return useQuery<{ success: boolean; data: ActiveEvent[] }>({
    queryKey: ['live-events', 'active'],
    queryFn: () =>
      fetch('/api/prisma/live-event/get-active').then((r) => r.json()),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });
}
