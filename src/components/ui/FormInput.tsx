import * as React from 'react';

import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { FormError } from '@/components/ui/FormError';

export interface FormInputProps extends React.ComponentProps<'input'> {
  label: string;
  error?: string | null;
  labelClassName?: string;
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, className, labelClassName, id, ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="grid gap-1.5">
        <Label htmlFor={inputId} className={cn('text-sm', labelClassName)}>
          {label}
        </Label>
        <Input
          id={inputId}
          ref={ref}
          className={cn(
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          {...props}
        />
        <FormError message={error} />
      </div>
    );
  }
);
FormInput.displayName = 'FormInput';

export { FormInput };
