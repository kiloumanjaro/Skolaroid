'use client';

import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog';

interface QRGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrUrl: string;
  expiresAt: Date;
  onCancel: () => void;
}

function formatCountdown(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function QRGateModal({
  open,
  onOpenChange,
  qrUrl,
  expiresAt,
  onCancel,
}: QRGateModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Reset and start countdown whenever the modal opens or expiresAt changes
  useEffect(() => {
    if (!open) return;
    const calc = () =>
      Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
    setSecondsLeft(calc());
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [open, expiresAt]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[calc(100vw-2rem)] max-w-sm sm:w-[calc(100vw-4rem)]"
        showCloseButton={false}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-0">
          <DialogTitle className="font-dancing text-3xl font-semibold">
            Save your <span className="text-skolaroid-blue">memory</span>
          </DialogTitle>
        </div>

        <div className="flex flex-col items-center gap-4 py-2">
          <div className="rounded border-2 border-border p-3">
            <QRCode value={qrUrl} size={180} />
          </div>

          <p className="mt-5 max-w-xs text-center text-sm text-muted-foreground">
            Scan with your phone, then sign in with your UP Google account to
            save this photo to your account.
          </p>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Expires in</span>
            <span
              className={`font-mono font-semibold ${secondsLeft < 60 ? 'text-red-500' : 'text-foreground'}`}
            >
              {formatCountdown(secondsLeft)}
            </span>
          </div>

          <button
            onClick={onCancel}
            className="flex w-full items-center justify-center border-2 border-black px-4 py-3 text-sm font-bold uppercase tracking-wide text-white transition active:scale-95"
            style={{ backgroundColor: '#4384dc' }}
          >
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
