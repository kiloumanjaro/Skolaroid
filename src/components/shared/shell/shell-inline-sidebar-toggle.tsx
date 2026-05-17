'use client';

import { useMainShellChrome } from '@/components/shared/shell/main-shell-sidebar-action';

export function ShellInlineSidebarToggle() {
  const shellChrome = useMainShellChrome();

  return (
    <button
      type="button"
      onClick={shellChrome?.toggleSidebar}
      className="group relative h-10 w-10 overflow-hidden border-2 border-border transition-colors sm:h-14 sm:w-14 sm:border-[3px]"
      aria-label={
        shellChrome?.sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'
      }
    >
      <div className="absolute inset-0 bg-card transition-all group-hover:bg-[#f6cb48] group-active:bg-[#f6cb48]" />
      <span className="relative flex h-full w-full flex-col items-center justify-center gap-1.5 text-foreground">
        <span className="block h-0.5 w-5 rounded-full bg-current sm:w-6" />
        <span className="block h-0.5 w-5 rounded-full bg-current sm:w-6" />
        <span className="block h-0.5 w-5 rounded-full bg-current sm:w-6" />
      </span>
    </button>
  );
}
