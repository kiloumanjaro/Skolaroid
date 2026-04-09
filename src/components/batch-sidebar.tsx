'use client';

import {
  BatchSidebarContent,
  type Era,
} from '@/components/BatchSidebarContent';
import { Sidebar } from '@/components/Sidebar';

export type { Era } from '@/components/BatchSidebarContent';

interface BatchSidebarProps {
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  isDragging: boolean;
  isAuthenticated: boolean;
  setLoginOpen: (open: boolean) => void;
  eras: Era[];
  onMouseDown: (e: React.MouseEvent) => void;
  drawerContentRef: React.RefObject<HTMLDivElement | null>;
}

export function BatchSidebar({
  drawerOpen,
  setDrawerOpen,
  isDragging,
  isAuthenticated,
  setLoginOpen,
  eras,
  onMouseDown,
  drawerContentRef,
}: BatchSidebarProps) {
  return (
    <Sidebar
      drawerOpen={drawerOpen}
      setDrawerOpen={setDrawerOpen}
      isDragging={isDragging}
      onMouseDown={onMouseDown}
      drawerContentRef={drawerContentRef}
    >
      <BatchSidebarContent
        eras={eras}
        isAuthenticated={isAuthenticated}
        setLoginOpen={setLoginOpen}
      />
    </Sidebar>
  );
}
