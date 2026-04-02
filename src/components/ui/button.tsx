import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { WOBBLY_RADIUS } from '@/lib/hand-drawn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-hand text-base transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 disabled:bg-muted disabled:text-muted-foreground disabled:border-dashed disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground border-[3px] border-border shadow-[4px_4px_0px_0px_#2d2d2d] hover:bg-primary/90 hover:shadow-[2px_2px_0px_0px_#2d2d2d] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]',
        destructive:
          'bg-destructive text-destructive-foreground border-[3px] border-border shadow-[4px_4px_0px_0px_#2d2d2d] hover:bg-destructive/90 hover:shadow-[2px_2px_0px_0px_#2d2d2d] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]',
        outline:
          'bg-card text-foreground border-[3px] border-border shadow-[4px_4px_0px_0px_#2d2d2d] hover:bg-accent hover:text-accent-foreground hover:shadow-[2px_2px_0px_0px_#2d2d2d] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]',
        secondary:
          'bg-secondary text-secondary-foreground border-[3px] border-border shadow-[4px_4px_0px_0px_#2d2d2d] hover:bg-[#2d5da1] hover:text-white hover:shadow-[2px_2px_0px_0px_#2d2d2d] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]',
        ghost: 'hover:bg-accent/10 hover:text-accent',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 px-3 text-sm',
        lg: 'h-12 px-8 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, style, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    const needsWobbly = variant !== 'ghost' && variant !== 'link';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        style={needsWobbly ? { borderRadius: WOBBLY_RADIUS, ...style } : style}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
