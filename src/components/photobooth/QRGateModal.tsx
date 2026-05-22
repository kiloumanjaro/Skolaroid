'use client';

import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { Loader2, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog';

interface QRGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrUrl: string;
  expiresAt: Date;
  onCancel: () => void;
  draftToken: string;
  onDirectUploadComplete?: () => void;
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
  draftToken,
  onDirectUploadComplete,
}: QRGateModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

  const handleDirectUpload = async () => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const res = await fetch(`/api/photobooth-draft/${draftToken}/submit`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        setUploadError(data.message || 'Failed to upload photo');
        setIsUploading(false);
        return;
      }

      onDirectUploadComplete?.();
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Failed to upload photo'
      );
      setIsUploading(false);
    }
  };

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

          {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}

          <div className="flex w-full flex-col gap-2">
            <button
              onClick={handleDirectUpload}
              disabled={isUploading}
              className="flex w-full items-center justify-center gap-2 border-2 border-black px-4 py-3 text-sm font-bold uppercase tracking-wide text-white transition active:scale-95 disabled:opacity-50"
              style={{ backgroundColor: '#7BC122' }}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Save to this device
                </>
              )}
            </button>
            <button
              onClick={onCancel}
              disabled={isUploading}
              className="flex w-full items-center justify-center border-2 border-black px-4 py-3 text-sm font-bold uppercase tracking-wide text-white transition active:scale-95 disabled:opacity-50"
              style={{ backgroundColor: '#4384dc' }}
            >
              Cancel
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
