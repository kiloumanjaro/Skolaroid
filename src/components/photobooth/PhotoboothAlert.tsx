'use client';

import { useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export function PhotoboothAlert() {
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(true);

  const success = searchParams.get('photobooth_success');
  const error = searchParams.get('photobooth_error');

  // Auto-dismiss success after 5 seconds
  useEffect(() => {
    if (success && visible) {
      const timer = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [success, visible]);

  if (!visible || (!success && !error)) {
    return null;
  }

  const isSuccess = !!success;
  const message = error
    ? decodeURIComponent(error)
    : 'Your photo has been saved successfully!';

  return (
    <div
      className={`fixed left-4 right-4 top-4 z-50 flex items-start gap-3 rounded-lg border-2 p-4 shadow-lg sm:left-auto sm:right-4 sm:w-96 ${
        isSuccess
          ? 'border-green-600 bg-green-50 text-green-900'
          : 'border-red-600 bg-red-50 text-red-900'
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
      ) : (
        <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
      )}
      <div className="flex-grow">
        <p className="text-sm font-medium">
          {isSuccess ? 'Memory Saved' : 'Upload Failed'}
        </p>
        <p className="mt-1 text-xs">{message}</p>
      </div>
      <button
        onClick={() => setVisible(false)}
        className="flex-shrink-0 text-current opacity-70 transition hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
