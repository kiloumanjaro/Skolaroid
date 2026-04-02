import { cn } from '@/lib/utils';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Brand colors used across the Skolaroid application.
 * Order: Maroon, Gold, Green, Lime, Blue
 */
export const BRAND_COLORS = [
  '#8E1537', // Maroon
  '#FFB81D', // Gold
  '#005740', // Green
  '#7BC122', // Lime
  '#208CD4', // Blue
] as const;

// =============================================================================
// TYPES
// =============================================================================

interface ColorStripProps {
  /**
   * Optional click handler for interactive strips
   */
  onClick?: () => void;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Accessibility label for interactive strips
   */
  ariaLabel?: string;
  /**
   * Whether the strip should be clickable and show hover effects
   */
  interactive?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * A vertical 5-color strip using Skolaroid brand colors.
 * Can be used as a decorative element or interactive trigger.
 */
export function ColorStrip({
  onClick,
  className,
  ariaLabel,
  interactive = false,
}: ColorStripProps) {
  const Component = interactive ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      aria-label={interactive ? ariaLabel : undefined}
      className={cn(
        'flex h-full w-2.5 shrink-0 flex-col',
        interactive && 'cursor-pointer focus:outline-none',
        className
      )}
      type={interactive ? 'button' : undefined}
    >
      {BRAND_COLORS.map((color, index) => (
        <div
          key={`${color}-${index}`}
          className="flex-1"
          style={{ backgroundColor: color }}
        />
      ))}
    </Component>
  );
}
