'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { LogOut } from 'lucide-react';

interface LeaveGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupName: string;
  isOwner?: boolean;
  onConfirmLeave: () => void;
}

export function LeaveGroupModal({
  open,
  onOpenChange,
  groupName,
  isOwner = false,
  onConfirmLeave,
}: LeaveGroupModalProps) {
  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent
        className="max-w-xs gap-0 overflow-hidden p-0"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Leave {groupName}</DialogTitle>

        <div className="flex flex-col items-center px-6 pb-6 pt-7 text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
            <LogOut size={18} className="text-red-500" />
          </div>
          <h2 className="font-kalam text-base font-semibold text-foreground">
            Leave Group?
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            {isOwner ? (
              <>
                If you leave{' '}
                <span className="font-medium text-foreground">{groupName}</span>
                , ownership will automatically transfer to an admin. If there is
                no admin, ownership will transfer to a member.
              </>
            ) : (
              <>
                Are you sure you want to leave{' '}
                <span className="font-medium text-foreground">{groupName}</span>
                ? You&apos;ll need a new invite to rejoin.
              </>
            )}
          </p>

          <div className="mt-5 flex w-full gap-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onConfirmLeave();
                handleClose();
              }}
              className="flex-1"
            >
              {isOwner ? 'Transfer & Leave' : 'Leave'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
