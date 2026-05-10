'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface NameInputModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (firstName: string, lastName: string) => void;
  initialFirstName?: string;
  initialLastName?: string;
}

export function NameInputModal({
  open,
  onOpenChange,
  onSubmit,
  initialFirstName = '',
  initialLastName = '',
}: NameInputModalProps) {
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);

  const canSubmit = firstName.trim().length > 0 && lastName.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(firstName.trim(), lastName.trim());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] flex-col sm:max-w-[425px]">
        <DialogTitle className="sr-only">Enter Your Name</DialogTitle>

        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Enter Your Name
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Provide your full name as it appears in school records
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label
                htmlFor="lastName"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                placeholder="e.g. Dela Cruz"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-skolaroid-blue"
              />
            </div>

            <div>
              <label
                htmlFor="firstName"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                placeholder="e.g. Juan"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-skolaroid-blue"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`w-full rounded-lg px-4 py-2 text-sm font-medium text-white transition ${
              canSubmit
                ? 'bg-skolaroid-blue hover:bg-blue-700'
                : 'cursor-not-allowed bg-gray-300 opacity-50'
            }`}
          >
            Confirm
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
