'use client';

import { useState, useMemo } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface BatchSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (batch: number) => void;
}

export function BatchSelectorModal({
  open,
  onOpenChange,
  onSelect,
}: BatchSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const batches = useMemo(() => {
    // Generate batches from 2000 to current year
    const currentYear = new Date().getFullYear();
    return Array.from(
      { length: currentYear - 1970 + 1 },
      (_, i) => 1970 + i
    ).reverse();
  }, []);

  const filteredBatches = batches.filter((batch) =>
    batch.toString().includes(searchQuery)
  );

  const handleSelect = (batch: number) => {
    onSelect(batch);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] flex-col sm:max-w-[425px]">
        <DialogTitle className="sr-only">Select Your Batch</DialogTitle>

        <div className="flex flex-shrink-0 flex-col gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Select Your Batch
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Choose the year you joined UP Cebu
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <input
              type="text"
              placeholder="Search batch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 focus:outline-none focus:ring-2 focus:ring-skolaroid-blue"
            />
          </div>
        </div>

        <div className="min-h-0 flex-grow overflow-y-auto">
          <div className="space-y-2">
            {filteredBatches.length > 0 ? (
              filteredBatches.map((batch) => (
                <button
                  key={batch}
                  onClick={() => handleSelect(batch)}
                  className="group flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-left transition hover:border-skolaroid-blue hover:bg-blue-50"
                >
                  <span className="font-medium text-gray-900">{batch}</span>
                  <ChevronRight className="h-4 w-4 text-gray-400 transition group-hover:text-skolaroid-blue" />
                </button>
              ))
            ) : (
              <div className="py-8 text-center text-sm text-gray-500">
                No batches found
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
