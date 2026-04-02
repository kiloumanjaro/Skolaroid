import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { WOBBLY_RADIUS_MD } from '@/lib/hand-drawn';

const polaroidVariants = cva(
  'bg-card border-2 border-border p-2 pb-12 shadow-[4px_4px_0px_0px_#2d2d2d] transition-all',
  {
    variants: {
      rotation: {
        none: '',
        left: '-rotate-2',
        right: 'rotate-2',
        tiltLeft: '-rotate-3',
        tiltRight: 'rotate-3',
      },
    },
    defaultVariants: {
      rotation: 'none',
    },
  }
);

export interface PolaroidCardProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof polaroidVariants> {
  /** Show decorative tape on top corner */
  tape?: boolean;
}

const PolaroidCard = React.forwardRef<HTMLDivElement, PolaroidCardProps>(
  ({ className, rotation, tape = false, style, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(polaroidVariants({ rotation }), className)}
      style={{ borderRadius: WOBBLY_RADIUS_MD, ...style }}
      {...props}
    >
      {tape && (
        <div
          className="absolute -top-3 left-1/2 z-10 h-6 w-16 -translate-x-1/2 rotate-3 border border-border/40 bg-postit/80"
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  )
);
PolaroidCard.displayName = 'PolaroidCard';

/** Caption area below the photo, styled like handwriting on a Polaroid */
const PolaroidCaption = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'absolute bottom-0 left-0 right-0 px-3 pb-2 pt-1 font-kalam text-sm text-foreground/80',
      className
    )}
    {...props}
  />
));
PolaroidCaption.displayName = 'PolaroidCaption';

export { PolaroidCard, PolaroidCaption, polaroidVariants };
