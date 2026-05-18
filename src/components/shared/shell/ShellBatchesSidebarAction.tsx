'use client';

import { Layers } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useMainShellSidebarAction } from '@/components/shared/shell/MainShellSidebarAction';

interface ShellBatchesSidebarActionProps {
  era?: number;
}

export function ShellBatchesSidebarAction({
  era = 2020,
}: ShellBatchesSidebarActionProps) {
  const router = useRouter();
  const pathname = usePathname();

  const sidebarAction = useMemo(
    () => ({
      id: 'shell-batches',
      label: 'Batches',
      icon: <Layers className="h-5 w-5" />,
      onClick: () => {
        const params = new URLSearchParams();
        params.set('era', String(era));
        params.set('openBatches', '1');
        router.push(`/map?${params.toString()}`);
      },
    }),
    [era, router]
  );

  useMainShellSidebarAction(pathname.startsWith('/map') ? null : sidebarAction);

  return null;
}
