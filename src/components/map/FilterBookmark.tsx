'use client';

import { Filter } from 'lucide-react';

interface FilterBookmarkProps {
  onClick: () => void;
}

export function FilterBookmark({ onClick }: FilterBookmarkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open filters"
      className="pointer-events-auto mr-[-2px] mt-auto flex h-40 w-10 translate-y-0 flex-col items-center justify-center gap-2 self-end border-2 border-black bg-[#4384dc] text-white shadow-[3px_3px_0_#1f1f1f] transition-transform duration-200 ease-out hover:-translate-y-2"
    >
      <Filter className="h-4 w-4 stroke-[2.5]" aria-hidden />
      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] [writing-mode:vertical-rl]">
        Filters
      </span>
    </button>
  );
}
