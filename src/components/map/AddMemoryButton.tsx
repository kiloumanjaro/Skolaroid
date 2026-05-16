'use client';

interface AddMemoryButtonProps {
  onClick: () => void;
}

export function AddMemoryButton({ onClick }: AddMemoryButtonProps) {
  return (
    <div className="absolute bottom-10 right-6 z-30 sm:bottom-14 sm:right-8">
      <button
        type="button"
        onClick={onClick}
        className="group relative h-10 w-10 overflow-hidden border-2 border-border transition-colors sm:h-14 sm:w-14 sm:border-[3px]"
        aria-label="Add memory"
      >
        <div className="absolute inset-0 bg-card transition-colors group-hover:bg-[#f6cb48] group-active:bg-[#f6cb48]" />
        <span className="relative flex h-full w-full items-center justify-center text-foreground">
          <span className="relative block h-4 w-4 sm:h-5 sm:w-5">
            <span className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-current" />
            <span className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 bg-current" />
          </span>
        </span>
      </button>
    </div>
  );
}
