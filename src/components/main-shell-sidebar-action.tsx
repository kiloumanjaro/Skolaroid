'use client';

import { createContext, useContext, useEffect, type ReactNode } from 'react';

export interface MainShellSidebarAction {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}

interface MainShellSidebarActionContextValue {
  setSidebarAction: (action: MainShellSidebarAction | null) => void;
}

const MainShellSidebarActionContext =
  createContext<MainShellSidebarActionContextValue | null>(null);

export function MainShellSidebarActionProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: MainShellSidebarActionContextValue;
}) {
  return (
    <MainShellSidebarActionContext.Provider value={value}>
      {children}
    </MainShellSidebarActionContext.Provider>
  );
}

export function useMainShellSidebarAction(
  action: MainShellSidebarAction | null
) {
  const context = useContext(MainShellSidebarActionContext);

  useEffect(() => {
    if (!context) return;

    context.setSidebarAction(action);

    return () => {
      context.setSidebarAction(null);
    };
  }, [action, context]);
}
