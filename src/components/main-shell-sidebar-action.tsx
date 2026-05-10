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

interface MainShellChromeContextValue {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openPanelCount: number;
  registerOpenPanel: () => void;
  unregisterOpenPanel: () => void;
}

const MainShellSidebarActionContext =
  createContext<MainShellSidebarActionContextValue | null>(null);
const MainShellChromeContext =
  createContext<MainShellChromeContextValue | null>(null);

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

export function MainShellChromeProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: MainShellChromeContextValue;
}) {
  return (
    <MainShellChromeContext.Provider value={value}>
      {children}
    </MainShellChromeContext.Provider>
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

export function useMainShellChrome() {
  return useContext(MainShellChromeContext);
}

export function usePanelOpenEffects(open: boolean) {
  const context = useMainShellChrome();
  const closeSidebar = context?.closeSidebar;
  const registerOpenPanel = context?.registerOpenPanel;
  const unregisterOpenPanel = context?.unregisterOpenPanel;

  useEffect(() => {
    if (!open || !closeSidebar || !registerOpenPanel || !unregisterOpenPanel) {
      return;
    }

    closeSidebar();
    registerOpenPanel();

    return () => {
      unregisterOpenPanel();
    };
  }, [closeSidebar, open, registerOpenPanel, unregisterOpenPanel]);
}

export function useAnyPanelOpen() {
  return (useMainShellChrome()?.openPanelCount ?? 0) > 0;
}
