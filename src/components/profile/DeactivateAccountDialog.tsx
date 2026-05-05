'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Check, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { createClient } from '@/lib/supabase/client';
import { profileFlatButtonClass } from '@/components/profile/profile-shell';

const REDIRECT_DELAY_SECONDS = 4;

interface DeactivateAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeactivateAccountDialog({
  open,
  onOpenChange,
}: DeactivateAccountDialogProps) {
  const router = useRouter();
  const [understood, setUnderstood] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isDeactivated, setIsDeactivated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(REDIRECT_DELAY_SECONDS);

  const handleClose = () => {
    if (isDeactivating || isDeactivated) return;
    setUnderstood(false);
    setError(null);
    onOpenChange(false);
  };

  // Sign out and redirect — shared by countdown and manual button
  const signOutAndRedirect = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  }, [router]);

  // Countdown timer after successful deactivation
  useEffect(() => {
    if (!isDeactivated) return;
    if (countdown <= 0) {
      signOutAndRedirect();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [isDeactivated, countdown, signOutAndRedirect]);

  const handleDeactivate = async () => {
    if (!understood || isDeactivating) return;

    setIsDeactivating(true);
    setError(null);

    try {
      const res = await fetch('/api/prisma/user/deactivate', {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to deactivate account');
      }

      // Transition to goodbye state; signout happens after countdown
      setIsDeactivated(true);
      setCountdown(REDIRECT_DELAY_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsDeactivating(false);
    }
  };

  // ── Success / goodbye screen ──────────────────────────────────────────
  if (isDeactivated) {
    return (
      <Dialog open onOpenChange={() => {}}>
        <DialogContent
          className="max-w-sm gap-0 overflow-hidden rounded-none border-2 border-border p-0 shadow-none"
          showCloseButton={false}
          style={{ borderRadius: 0 }}
        >
          <DialogTitle className="sr-only">Account Deactivated</DialogTitle>

          <div className="flex flex-col items-center px-6 pb-6 pt-7 text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-green-50">
              <Check size={18} className="text-green-500" />
            </div>

            <h2 className="font-kalam text-base font-semibold text-foreground">
              Account Deactivated
            </h2>

            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              Your account has been deactivated and your memories are now
              hidden. Log back in within 30 days to reactivate.
            </p>

            <p className="mt-3 text-xs text-muted-foreground">
              Redirecting in{' '}
              <span className="font-semibold text-foreground">
                {countdown}s
              </span>
              …
            </p>

            <Button
              variant="outline"
              onClick={signOutAndRedirect}
              className={`${profileFlatButtonClass} mt-4 w-full`}
              style={{ borderRadius: 0 }}
            >
              Go to Home Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Confirmation screen ───────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent
        className="max-w-sm gap-0 overflow-hidden rounded-none border-2 border-border p-0 shadow-none"
        showCloseButton={false}
        style={{ borderRadius: 0 }}
      >
        <DialogTitle className="sr-only">Deactivate Account</DialogTitle>

        <div className="flex flex-col items-center px-6 pb-6 pt-7 text-center">
          {/* Icon */}
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-yellow-50">
            <AlertTriangle size={18} className="text-yellow-500" />
          </div>

          {/* Heading */}
          <h2 className="font-kalam text-base font-semibold text-foreground">
            Deactivate Your Account?
          </h2>

          {/* Warning banner */}
          <div className="mt-3 w-full rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2.5 text-left">
            <p className="text-xs leading-relaxed text-yellow-800">
              Your account will be deactivated and your memories will be hidden.
              You have <span className="font-semibold">30 days</span> to
              reactivate. After 30 days, your account and all memories will be{' '}
              <span className="font-semibold">permanently deleted</span>.
            </p>
          </div>

          {/* Checkbox confirmation — must be checked to enable the confirm button */}
          <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-left">
            <Checkbox
              id="deactivate-understood"
              checked={understood}
              onCheckedChange={(checked) => setUnderstood(checked === true)}
              disabled={isDeactivating}
              className="mt-0.5 shrink-0"
            />
            <span className="text-xs leading-relaxed text-muted-foreground">
              I understand my account will be permanently deleted if I
              don&rsquo;t reactivate within 30 days
            </span>
          </label>

          {/* Error message */}
          {error && (
            <p className="mt-2 text-xs font-medium text-red-500">{error}</p>
          )}

          {/* Actions */}
          <div className="mt-5 flex w-full gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isDeactivating}
              className={`${profileFlatButtonClass} flex-1`}
              style={{ borderRadius: 0 }}
            >
              Cancel
            </Button>
            <Button
              id="confirm-deactivate-account"
              variant="destructive"
              onClick={handleDeactivate}
              disabled={!understood || isDeactivating}
              className={`${profileFlatButtonClass} flex-1`}
              style={{ borderRadius: 0 }}
            >
              {isDeactivating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Deactivating…
                </>
              ) : (
                'Deactivate Account'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
