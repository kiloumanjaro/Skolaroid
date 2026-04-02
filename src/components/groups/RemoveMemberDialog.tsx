'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserMinus } from 'lucide-react';

interface RemoveMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberName: string;
  isLoading?: boolean;
  onConfirm: () => void;
}

export function RemoveMemberDialog({
  open,
  onOpenChange,
  memberName,
  isLoading,
  onConfirm,
}: RemoveMemberDialogProps) {
  const handleClose = () => {
    if (!isLoading) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent
        className="max-w-xs gap-0 overflow-hidden p-0"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Remove Member</DialogTitle>

        <div className="flex flex-col items-center px-6 pb-6 pt-7 text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
            <UserMinus size={18} className="text-red-500" />
          </div>
          <h2 className="font-kalam text-base font-semibold text-foreground">
            Remove Member?
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            Are you sure you want to remove{' '}
            <span className="font-medium text-foreground">{memberName}</span>{' '}
            from this group? They will need a new invite to rejoin.
          </p>

          <div className="mt-5 flex w-full gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Removing…' : 'Remove'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
