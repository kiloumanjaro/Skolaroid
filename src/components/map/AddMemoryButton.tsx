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
        className="group relative h-14 w-14 overflow-hidden border-[3px] border-border transition-all hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px]"
        aria-label="Add memory"
      >
        <div className="absolute inset-0 bg-card transition-all group-hover:bg-[#f6cb48] group-active:bg-[#f6cb48]" />
        <span className="relative flex h-full w-full items-center justify-center text-foreground">
          <span className="relative block h-5 w-5">
            <span className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-current" />
            <span className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 bg-current" />
          </span>
        </span>
      </button>
    </div>
  );
}
