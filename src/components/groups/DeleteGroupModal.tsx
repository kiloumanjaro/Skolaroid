'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlertTriangle } from 'lucide-react';

// ─── PROPS ──────────────────────────────────────────────────────────

interface DeleteGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupName: string;
  onConfirmDelete: () => void;
}

// ─── COMPONENT ──────────────────────────────────────────────────────

export function DeleteGroupModal({
  open,
  onOpenChange,
  groupName,
  onConfirmDelete,
}: DeleteGroupModalProps) {
  const [confirmInput, setConfirmInput] = useState('');

  const handleClose = () => {
    setConfirmInput('');
    onOpenChange(false);
  };

  const doesNotMatch =
    confirmInput.length > 0 && confirmInput.trim() !== groupName;
  const isDisabled = confirmInput.trim() !== groupName;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent
        className="flex max-w-md gap-0 overflow-hidden p-0"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Delete Group</DialogTitle>

        <div className="flex w-full flex-col">
          {/* Header */}
          <div className="px-6 pb-0 pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle size={20} className="shrink-0 text-red-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                Delete Group
              </h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              This action cannot be undone. All posts, members, and data in this
              group will be permanently deleted.
            </p>
          </div>

          {/* Body */}
          <div className="space-y-4 px-6 py-5">
            <p className="text-sm text-gray-600">
              To confirm, type{' '}
              <strong className="font-semibold text-gray-900">
                {groupName}
              </strong>{' '}
              below:
            </p>
            <div className="space-y-1.5">
              <Input
                placeholder="Type group name to confirm"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                className={
                  doesNotMatch
                    ? 'border-red-300 focus-visible:ring-red-300'
                    : ''
                }
              />
              {doesNotMatch && (
                <p className="text-xs text-red-500">Name does not match.</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t bg-white px-6 py-4">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onConfirmDelete();
                handleClose();
              }}
              disabled={isDisabled}
              className={`bg-red-600 text-white hover:bg-red-700 ${
                isDisabled ? 'cursor-not-allowed opacity-50' : ''
              }`}
            >
              Delete Group
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
