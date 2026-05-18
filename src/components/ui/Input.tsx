import * as React from 'react';

import { cn } from '@/lib/utils';
import { WOBBLY_RADIUS } from '@/lib/hand-drawn';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, style, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full border-2 border-border bg-transparent px-3 py-1 font-hand text-base transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:border-dashed disabled:bg-muted disabled:opacity-60',
          className
        )}
        style={{ borderRadius: WOBBLY_RADIUS, ...style }}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
