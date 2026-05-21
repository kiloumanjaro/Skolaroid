'use client';

import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';

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
      <DialogContent className="max-w-sm" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Save your memory</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          <div className="rounded border-2 border-border p-3">
            <QRCode value={qrUrl} size={180} />
          </div>

          <p className="text-center text-sm text-muted-foreground">
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

          <p className="text-center text-xs text-muted-foreground">
            Keep this page open while you register on your phone.
          </p>

          <button
            onClick={onCancel}
            className="w-full border border-border px-4 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
