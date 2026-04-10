'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

export interface Era {
  decade: number;
  label: string;
  color: string;
  imageUrl?: string;
}

interface BatchSidebarContentProps {
  eras: Era[];
  isAuthenticated: boolean;
  setLoginOpen: (open: boolean) => void;
}

const ROTATIONS = [
  'rotate-[-8deg]',
  'rotate-[5deg]',
  'rotate-[-3deg]',
  'rotate-[7deg]',
  'rotate-[-6deg]',
  'rotate-[4deg]',
  'rotate-[-5deg]',
  'rotate-[6deg]',
];

const OFFSETS = [
  'ml-[20px]',
  'ml-[150px]',
  'ml-[-10px]',
  'ml-[100px]',
  'ml-[50px]',
  'ml-[180px]',
  'ml-[10px]',
  'ml-[120px]',
];

export function BatchSidebarContent({
  eras,
  isAuthenticated,
  setLoginOpen,
}: BatchSidebarContentProps) {
  const router = useRouter();

  return (
    <div className="p-4 pt-8">
      <div className="relative flex flex-col space-y-[-140px] pb-32 pl-12">
        {eras.map((era, index) => (
          <button
            type="button"
            key={era.decade}
            onClick={() => {
              if (isAuthenticated) {
                router.push(`/map?era=${era.decade}`);
                return;
              }

              setLoginOpen(true);
            }}
            className={`relative transform cursor-pointer transition-all hover:z-50 hover:rotate-0 hover:scale-110 ${
              ROTATIONS[index % ROTATIONS.length]
            } ${OFFSETS[index % OFFSETS.length]}`}
            style={{ zIndex: index }}
            aria-label={`Explore ${era.label} memories`}
          >
            <div className="w-80 border-2 border-border bg-card p-2 pb-12 shadow-[4px_4px_0px_0px_#2d2d2d]">
              <div className="relative h-[320px] overflow-hidden bg-secondary">
                {era.imageUrl ? (
                  <Image
                    src={era.imageUrl}
                    alt={`${era.label} era photo`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div
                    className={`flex h-full w-full items-center justify-center ${era.color}`}
                  >
                    <span className="text-3xl font-semibold text-muted-foreground">
                      {era.label}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
