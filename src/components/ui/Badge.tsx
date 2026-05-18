import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { WOBBLY_RADIUS } from '@/lib/hand-drawn';

const badgeVariants = cva(
  'inline-flex items-center border-2 border-border px-2.5 py-0.5 text-xs font-hand font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring/20',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'bg-transparent text-foreground',
        tag: 'bg-postit text-foreground hover:bg-postit/80',
        role: 'bg-primary/20 text-primary hover:bg-primary/30',
        status: 'bg-green-100 text-green-800 border-green-800/50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, style, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      style={{ borderRadius: WOBBLY_RADIUS, ...style }}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
