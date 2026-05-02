'use client';

import { useMainShellChrome } from '@/components/main-shell-sidebar-action';

export function ShellInlineSidebarToggle() {
  const shellChrome = useMainShellChrome();

  return (
    <button
      type="button"
      onClick={shellChrome?.toggleSidebar}
      className="group relative h-14 w-14 overflow-hidden border-[3px] border-border"
      aria-label={
        shellChrome?.sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'
      }
    >
      <div className="absolute inset-0 bg-card transition-all group-hover:bg-[#f6cb48] group-active:bg-[#f6cb48]" />
      <span className="relative flex h-full w-full flex-col items-center justify-center gap-1.5 text-foreground">
        <span className="block h-0.5 w-6 rounded-full bg-current" />
        <span className="block h-0.5 w-6 rounded-full bg-current" />
        <span className="block h-0.5 w-6 rounded-full bg-current" />
      </span>
    </button>
  );
}
