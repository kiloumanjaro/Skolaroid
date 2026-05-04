'use client';

import Image from 'next/image';
import { Clock } from 'lucide-react';

export interface MemoryPinProps {
  src: string;
  alt?: string;
  isPending?: boolean;
  onClick?: () => void;
}

export function MemoryPin({
  src,
  alt = 'Memory',
  isPending = false,
  onClick,
}: MemoryPinProps) {
  const ariaLabel = isPending ? `${alt} (Pending approval)` : alt;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-fit cursor-pointer transition-transform duration-200 hover:-translate-y-1"
      aria-label={ariaLabel}
    >
      {isPending && (
        <span className="absolute -right-2 -top-2 z-20 flex h-5 w-5 items-center justify-center rounded-full border-2 border-black bg-amber-200 text-black shadow-sm">
          <Clock className="h-3 w-3" aria-hidden="true" />
        </span>
      )}
      <div className="relative w-[74px] rounded-md border-2 border-black bg-white px-[5px] pb-[20px] pt-[5px]">
        <div className="relative aspect-square w-full overflow-hidden rounded-sm border-[1px] border-black bg-neutral-100">
          <Image src={src} alt={alt} fill className="object-cover" />
        </div>
      </div>
    </button>
  );
}
