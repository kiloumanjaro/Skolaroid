'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

export interface Era {
  decade: number;
  label: string;
  color: string;
  imageUrl?: string;
}

interface BatchSidebarProps {
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  isDragging: boolean;
  isAuthenticated: boolean;
  setLoginOpen: (open: boolean) => void;
  eras: Era[];
  onMouseDown: (e: React.MouseEvent) => void;
  drawerContentRef: React.RefObject<HTMLDivElement | null>;
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

export function BatchSidebar({
  drawerOpen,
  setDrawerOpen,
  isDragging,
  isAuthenticated,
  setLoginOpen,
  eras,
  onMouseDown,
  drawerContentRef,
}: BatchSidebarProps) {
  const router = useRouter();

  return (
    <div
      className={`fixed left-0 top-0 z-40 flex h-screen transition-all duration-300 ease-in-out ${
        drawerOpen ? 'w-[600px]' : 'w-2.5'
      }`}
    >
      {/* Drawer Content - Polaroid Grid */}
      <div
        ref={drawerContentRef}
        onMouseDown={onMouseDown}
        className={`scrollbar-hide h-screen overflow-y-auto bg-white transition-all duration-300 ease-in-out ${
          drawerOpen ? 'w-[calc(100%-10px)] opacity-100' : 'w-0 opacity-0'
        } ${isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {drawerOpen && (
          <div className="p-4 pt-8">
            {/* Polaroid Stack - Era Selection */}
            <div className="relative flex flex-col space-y-[-140px] pb-32 pl-12">
              {eras.map((era, index) => (
                <button
                  key={era.decade}
                  onClick={() => {
                    if (isAuthenticated) {
                      router.push(`/map?era=${era.decade}`);
                    } else {
                      setLoginOpen(true);
                    }
                  }}
                  className={`relative transform cursor-pointer transition-all hover:z-50 hover:rotate-0 hover:scale-110 ${ROTATIONS[index]} ${OFFSETS[index]}`}
                  style={{ zIndex: index }}
                  aria-label={`Explore ${era.label} memories`}
                >
                  {/* Polaroid Frame */}
                  <div className="h-96 w-80 bg-white shadow-xl">
                    {/* Image or Placeholder */}
                    <div className="relative h-[320px] w-full overflow-hidden">
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
                          <span className="text-3xl font-semibold text-gray-600">
                            {era.label}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Polaroid Caption */}
                    <div className="flex h-[64px] items-center justify-center">
                      <span className="text-lg font-medium text-gray-800">
                        {era.label}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Color Strip - Right Border */}
      <button
        onClick={() => setDrawerOpen(!drawerOpen)}
        onMouseEnter={() => setDrawerOpen(true)}
        className="flex h-screen w-2.5 flex-shrink-0 cursor-pointer flex-col transition-all hover:w-3"
        aria-label="Expand drawer"
      >
        <div className="flex-1 bg-[#8E1537]" />
        <div className="flex-1 bg-[#FFB81D]" />
        <div className="flex-1 bg-[#005740]" />
        <div className="flex-1 bg-[#7BC122]" />
        <div className="flex-1 bg-[#208CD4]" />
      </button>
    </div>
  );
}
