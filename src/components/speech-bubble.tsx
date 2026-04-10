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
}

export function SpeechBubble({
  width = 600,
  height = 300,
  title,
  message,
  visible = true,
  className,
  style,
  ...props
}: SpeechBubbleProps) {
  return (
    <div
      className={cn(
        'relative inline-block font-hand transition-all duration-200',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
        className
      )}
      style={{ width: `${width}px`, height: `${height + 34}px`, ...style }}
      {...props}
    >
      <svg
        width={width}
        height={height + 34}
        viewBox={`0 0 ${width} ${height + 34}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="block"
      >
        {/* Main bubble rectangle with wobbly corners */}
        <rect
          x="6"
          y="6"
          width={width - 12}
          height={height - 12}
          fill="#ffffff"
          stroke="#2d2d2d"
          strokeWidth="2.5"
          style={{ borderRadius: WOBBLY_RADIUS_MD }}
        />

        {/* Tail polygon - draws from inside the bubble outward */}
        <path
          d={`
            M ${width - 72} ${height - 6}
            L ${width - 50} ${height + 17}
            L ${width - 30} ${height - 6}
            Z
          `}
          fill="#ffffff"
          stroke="none"
        />

        {/* Tail border strokes - two separate lines that connect smoothly */}
        <path
          d={`M ${width - 72} ${height - 6} L ${width - 50} ${height + 17}`}
          stroke="#2d2d2d"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={`M ${width - 50} ${height + 17} L ${width - 30} ${height - 6}`}
          stroke="#2d2d2d"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Rhomboid cover to hide the bottom border where tail connects */}
        <path
          d={`
            M ${width - 72} ${height - 7.5}
            L ${width - 30} ${height - 7.5}
            L ${width - 34} ${height - 4.5}
            L ${width - 68} ${height - 4.5}
            Z
          `}
          fill="#ffffff"
        />
      </svg>
      {(title || message) && (
        <div
          className="absolute left-0 top-0 flex items-center justify-center p-4"
          style={{ width: `${width}px`, height: `${height}px` }}
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
      )}
    </div>
  );
}
