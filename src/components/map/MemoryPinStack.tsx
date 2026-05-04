'use client';

import { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Clock } from 'lucide-react';

interface StackedMemory {
  id: string;
  title: string;
  mediaURL: string;
  isPending?: boolean;
}

interface MemoryPinStackProps {
  memories: StackedMemory[];
  onClick: (memoryId: string) => void;
}

const MAX_VISIBLE_PINS = 8;

/**
 * Renders a stack of memory pins that fan out in a circular pattern on hover.
 * Shows a count badge if 2+ memories are at the same location.
 */
export function MemoryPinStack({ memories, onClick }: MemoryPinStackProps) {
  const [isHovered, setIsHovered] = useState(false);
  const pendingBadgeClassName =
    'absolute -right-2 -top-2 z-20 flex h-5 w-5 items-center justify-center rounded-full border-2 border-black bg-amber-200 text-black shadow-sm';

  const visibleMemories = useMemo(
    () => memories.slice(0, MAX_VISIBLE_PINS),
    [memories]
  );

  const overflow = memories.length - MAX_VISIBLE_PINS;
  const pinSize = 74;

  /** Calculate fan-out position for each pin in the stack. */
  const getFanOutStyle = useCallback(
    (index: number): React.CSSProperties => {
      if (!isHovered || memories.length <= 1) {
        return {
          transform: `translateY(${-index * 3}px)`,
          zIndex: memories.length - index,
          transition: 'transform 300ms cubic-bezier(0.33, 1, 0.68, 1)',
        };
      }

      const count = visibleMemories.length;
      // Fan out in an arc above the stack point
      const totalArc = Math.min(count * 40, 240); // degrees of arc
      const startAngle = -90 - totalArc / 2; // Start from top-center
      const angleStep = count > 1 ? totalArc / (count - 1) : 0;
      const angle = startAngle + index * angleStep;
      const radians = (angle * Math.PI) / 180;

      // Radius increases with more pins for better spacing
      const radius = 44 + count * 4;
      const x = Math.cos(radians) * radius;
      const y = Math.sin(radians) * radius;

      return {
        transform: `translate(${x}px, ${y}px)`,
        zIndex: count - index + 10,
        transition: `transform 300ms cubic-bezier(0.33, 1, 0.68, 1) ${index * 30}ms`,
      };
    },
    [isHovered, memories.length, visibleMemories.length]
  );

  if (memories.length === 0) return null;

  // Single memory — just render a normal pin
  if (memories.length === 1) {
    const mem = memories[0];
    const ariaLabel = mem.isPending
      ? `${mem.title} (Pending approval)`
      : mem.title;
    return (
      <button
        type="button"
        onClick={() => onClick(mem.id)}
        className="group relative w-fit cursor-pointer transition-transform duration-200 hover:-translate-y-1"
        aria-label={ariaLabel}
      >
        {mem.isPending && (
          <span className={pendingBadgeClassName}>
            <Clock className="h-3 w-3" aria-hidden="true" />
          </span>
        )}
        <div className="relative w-[74px] rounded-md border-2 border-black bg-white px-[5px] pb-[20px] pt-[5px]">
          <div className="relative aspect-square w-full overflow-hidden rounded-sm border-[1px] border-black bg-neutral-100">
            <Image
              src={mem.mediaURL}
              alt={mem.title}
              fill
              className="object-cover"
            />
          </div>
        </div>
      </button>
    );
  }

  return (
    <div
      className="relative cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ width: pinSize, height: pinSize }}
    >
      {/* Fanned pins */}
      {visibleMemories.map((mem, index) => (
        <button
          key={mem.id}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClick(mem.id);
          }}
          className="absolute left-0 top-0 w-[74px] cursor-pointer transition-transform duration-200 hover:-translate-y-1"
          style={getFanOutStyle(index)}
          aria-label={
            mem.isPending ? `${mem.title} (Pending approval)` : mem.title
          }
        >
          {mem.isPending && (
            <span className={pendingBadgeClassName}>
              <Clock className="h-3 w-3" aria-hidden="true" />
            </span>
          )}
          <div className="relative w-[74px] rounded-md border-2 border-black bg-white px-[5px] pb-[20px] pt-[5px]">
            <div className="relative aspect-square w-full overflow-hidden rounded-sm border-[1px] border-black bg-neutral-100">
              <Image
                src={mem.mediaURL}
                alt={mem.title}
                fill
                className="object-cover"
              />
            </div>
          </div>
        </button>
      ))}

      {/* Count badge — visible when NOT hovered, or when overflow exists */}
      <div
        className="absolute -right-2 -top-2 z-50 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-black bg-[#c0f7fe] px-1.5 text-[10px] font-bold text-black shadow-md transition-opacity duration-200"
        style={{ opacity: isHovered && overflow <= 0 ? 0 : 1 }}
      >
        {isHovered && overflow > 0 ? `+${overflow}` : memories.length}
      </div>
    </div>
  );
}
