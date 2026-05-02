'use client';

import Image from 'next/image';

export interface MemoryPinProps {
  src: string;
  alt?: string;
  onClick?: () => void;
}

export function MemoryPin({ src, alt = 'Memory', onClick }: MemoryPinProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-fit cursor-pointer transition-transform duration-200 hover:-translate-y-1"
      aria-label={alt}
    >
      <div className="relative w-[74px] rounded-md border-2 border-black bg-white px-[5px] pb-[20px] pt-[5px]">
        <div className="relative aspect-square w-full overflow-hidden rounded-sm border-[1px] border-black bg-neutral-100">
          <Image src={src} alt={alt} fill className="object-cover" />
        </div>
      </div>
    </button>
  );
}
