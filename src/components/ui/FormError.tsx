import * as React from 'react';

import { cn } from '@/lib/utils';

interface FormErrorProps extends React.HTMLAttributes<HTMLParagraphElement> {
  message?: string | null;
}

const FormError = React.forwardRef<HTMLParagraphElement, FormErrorProps>(
  ({ message, className, ...props }, ref) => {
    if (!message) return null;

    return (
      <p
        ref={ref}
        role="alert"
        className={cn('text-xs font-medium text-destructive', className)}
        {...props}
      >
        {message}
      </p>
    );
  }
);
FormError.displayName = 'FormError';

export { FormError };
