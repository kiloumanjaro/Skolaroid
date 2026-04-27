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
        className="group relative h-14 w-32 overflow-hidden rounded-2xl border-2 border-border shadow-[4px_4px_0px_0px_#2d2d2d] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#2d2d2d] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
        aria-label="Add memory"
      >
        <div className="absolute left-0 top-0 h-14 w-32 rounded-2xl bg-card transition-all group-hover:bg-[#f6cb48] group-active:bg-[#f6cb48]" />
        <div className="text-md relative flex h-14 w-32 items-center justify-center pb-1 text-center font-medium text-foreground transition-colors group-hover:text-foreground group-active:text-foreground">
          <span>Add Memory</span>
        </div>
      </button>
    </div>
  );
}
