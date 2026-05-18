'use client';

import { useRouter } from 'next/navigation';
import { PolaroidFrame } from './PolaroidFrame';

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
  'ml-[0px] sm:ml-[20px]',
  'ml-[36px] sm:ml-[150px]',
  'ml-[-8px] sm:ml-[-10px]',
  'ml-[24px] sm:ml-[100px]',
  'ml-[12px] sm:ml-[50px]',
  'ml-[44px] sm:ml-[180px]',
  'ml-[4px] sm:ml-[10px]',
  'ml-[28px] sm:ml-[120px]',
];

export function BatchSidebarContent({
  eras,
  isAuthenticated,
  setLoginOpen,
}: BatchSidebarContentProps) {
  const router = useRouter();

  return (
    <div className="p-4 pt-8 sm:p-4 sm:pt-8">
      <div className="relative flex flex-col items-center space-y-[-92px] pb-24 sm:items-start sm:space-y-[-140px] sm:pb-32 sm:pl-12">
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
            className={`group relative transform cursor-pointer transition-all hover:z-50 hover:rotate-0 hover:scale-110 ${
              ROTATIONS[index % ROTATIONS.length]
            } ${OFFSETS[index % OFFSETS.length]} w-[calc(100vw-4rem)] max-w-[16rem] sm:w-auto sm:max-w-none`}
            style={{ zIndex: index }}
            aria-label={`Explore ${era.label} memories`}
          >
            <PolaroidFrame
              imageUrl={era.imageUrl}
              label={era.label}
              color={era.color}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
