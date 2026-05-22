'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteMemoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memoryTitle: string;
  onConfirmDelete: () => void;
  isPending: boolean;
}

export function DeleteMemoryModal({
  open,
  onOpenChange,
  memoryTitle,
  onConfirmDelete,
  isPending,
}: DeleteMemoryModalProps) {
  const handleClose = () => {
    if (!isPending) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent
        className="flex max-w-md gap-0 overflow-hidden p-0"
        showCloseButton={false}
        portalClassName="z-[40000]"
      >
        <DialogTitle className="sr-only">Delete Memory</DialogTitle>

        <div className="flex w-full flex-col">
          {/* Header */}
          <div className="px-6 pb-0 pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle size={20} className="shrink-0 text-red-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                Delete Memory
              </h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              This action cannot be undone. The memory{' '}
              <strong className="font-semibold text-gray-900">
                &ldquo;{memoryTitle}&rdquo;
              </strong>{' '}
              will be permanently deleted.
            </p>
          </div>

          {/* Footer */}
          <div className="mt-4 flex justify-end gap-3 border-t bg-white px-6 py-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirmDelete}
              disabled={isPending}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                'Delete Memory'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
