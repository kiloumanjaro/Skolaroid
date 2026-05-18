'use client';

import { BatchSidebarContent, type Era } from './BatchSidebarContent';
import { Sidebar } from '../shared/shell/Sidebar';

export type { Era } from './BatchSidebarContent';

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
      className="z-[140]"
      expandedWidthClassName="w-screen max-w-[600px]"
    >
      <BatchSidebarContent
        eras={eras}
        isAuthenticated={isAuthenticated}
        setLoginOpen={setLoginOpen}
      />
    </Sidebar>
  );
}
