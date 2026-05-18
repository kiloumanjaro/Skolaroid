import * as React from 'react';

import { Button, type ButtonProps } from '@/components/ui/button';

interface FormButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
}

const FormButton = React.forwardRef<HTMLButtonElement, FormButtonProps>(
  (
    {
      children,
      isLoading = false,
      loadingText = 'Please wait...',
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <Button ref={ref} disabled={disabled ?? isLoading} {...props}>
        {isLoading ? loadingText : children}
      </Button>
    );
  }
);
FormButton.displayName = 'FormButton';

export { FormButton };
