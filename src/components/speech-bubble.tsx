import React from 'react';
import { cn } from '@/lib/utils';
import { WOBBLY_RADIUS_MD } from '@/lib/hand-drawn';

interface SpeechBubbleProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The width of the speech bubble
   * @default 600
   */
  width?: number;
  /**
   * The height of the speech bubble
   * @default 300
   */
  height?: number;
  /**
   * Title to display inside the bubble
   */
  title?: string;
  /**
   * Body text to display inside the bubble
   */
  message?: string;
  /**
   * Whether the bubble is visible
   * @default true
   */
  visible?: boolean;
  /**
   * Position of the tail. Can be 'center', 'right', or a number representing pixel offset from the center
   * @default 'right'
   */
  tailPosition?: 'center' | 'right' | number;
}

export function SpeechBubble({
  width = 600,
  title,
  message,
  visible = true,
  tailPosition = 'right',
  className,
  style,
  ...props
}: SpeechBubbleProps) {
  const calculatedCenter =
    typeof tailPosition === 'number'
      ? width / 2 + tailPosition
      : tailPosition === 'center'
        ? width / 2
        : width - 50;

  // Safe bounds: Prevent the tail from drawing outside the bubble's width
  const tailCenterX = Math.max(35, Math.min(calculatedCenter, width - 35));

  const tailStartX = tailCenterX - 22;
  const tailEndX = tailCenterX + 20;

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-end font-hand transition-all duration-200',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
        className
      )}
      style={{ width: `${width}px`, ...style }}
      {...props}
    >
      <div
        className="relative z-10 flex w-full flex-col items-center justify-center bg-white p-4"
        style={{
          border: '2.5px solid #2d2d2d',
          borderRadius: WOBBLY_RADIUS_MD,
        }}
      >
        <div
          className="mx-auto space-y-2 text-center"
          style={{ maxWidth: `${Math.max(width - 72, 160)}px` }}
        >
          {title && (
            <p className="font-kalam text-sm font-semibold leading-none text-foreground">
              {title}
            </p>
          )}
          {message && (
            <p className="font-hand text-sm leading-snug text-foreground">
              {message}
            </p>
          )}
        </div>
      </div>

      <svg
        width={width}
        height={22}
        viewBox={`0 0 ${width} 22`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="pointer-events-none z-20 mt-[-2.5px] block"
      >
        {/* Tail polygon - draws from inside the bubble outward */}
        <path
          d={`
            M ${tailStartX} 0
            L ${tailCenterX} 21
            L ${tailEndX} 0
            Z
          `}
          fill="#ffffff"
          stroke="none"
        />

        {/* Tail border strokes - two separate lines that connect smoothly */}
        <path
          d={`M ${tailStartX} 0 L ${tailCenterX} 21`}
          stroke="#2d2d2d"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={`M ${tailCenterX} 21 L ${tailEndX} 0`}
          stroke="#2d2d2d"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Rhomboid cover to hide the bottom border where tail connects */}
        <path
          d={`
            M ${tailStartX} -2
            L ${tailEndX} -2
            L ${tailEndX - 4} 3
            L ${tailStartX + 4} 3
            Z
          `}
          fill="#ffffff"
        />
      </svg>
    </div>
  );
}
