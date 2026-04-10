'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Copy, Check, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

const CHALLENGE_PHRASE = 'delete-my-account';
const REDIRECT_DELAY_SECONDS = 4;

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAccountDialog({
  open,
  onOpenChange,
}: DeleteAccountDialogProps) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(REDIRECT_DELAY_SECONDS);

  const isConfirmed = confirmation === CHALLENGE_PHRASE;

  const handleClose = () => {
    if (isDeleting || isDeleted) return;
    setConfirmation('');
    setError(null);
    setCopied(false);
    onOpenChange(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(CHALLENGE_PHRASE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the text so the user can copy manually
    }
  };

  // Sign out and redirect — extracted so the countdown and manual button can share it
  const signOutAndRedirect = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  }, [router]);

  // Countdown timer after successful deletion
  useEffect(() => {
    if (!isDeleted) return;

    if (countdown <= 0) {
      signOutAndRedirect();
      return;
    }

    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [isDeleted, countdown, signOutAndRedirect]);

  const handleDelete = async () => {
    if (!isConfirmed || isDeleting) return;

    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch('/api/prisma/user/delete', { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to delete account');
      }

      // Transition to the goodbye state instead of redirecting immediately
      setIsDeleted(true);
      setCountdown(REDIRECT_DELAY_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsDeleting(false);
    }
  };

  // ── Success / goodbye screen ──────────────────────────────────────────
  if (isDeleted) {
    return (
      <Dialog open onOpenChange={() => {}}>
        <DialogContent
          className="max-w-sm gap-0 overflow-hidden p-0"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">Account Deleted</DialogTitle>

          <div className="flex flex-col items-center px-6 pb-6 pt-7 text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-green-50">
              <Check size={18} className="text-green-500" />
            </div>

            <h2 className="font-kalam text-base font-semibold text-foreground">
              Account Deleted
            </h2>

            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              Your account and all associated data have been removed.
              We&rsquo;re sorry to see you go. 👋
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
              className="mt-4 w-full"
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
        className="max-w-sm gap-0 overflow-hidden p-0"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Delete Account</DialogTitle>

        <div className="flex flex-col items-center px-6 pb-6 pt-7 text-center">
          {/* Icon */}
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
            <Trash2 size={18} className="text-red-500" />
          </div>

          {/* Heading */}
          <h2 className="font-kalam text-base font-semibold text-foreground">
            Delete Your Account?
          </h2>

          {/* Warning text */}
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            This action is{' '}
            <span className="font-semibold text-red-500">permanent</span>. Your
            profile and all uploaded memories will be removed. This cannot be
            undone.
          </p>

          {/* Challenge */}
          <div className="mt-4 w-full">
            <p className="mb-1.5 text-xs text-muted-foreground">
              Type{' '}
              <span className="inline-flex items-center gap-1">
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-medium text-foreground">
                  {CHALLENGE_PHRASE}
                </code>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center justify-center rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Copy challenge phrase"
                  id="copy-challenge-phrase"
                >
                  {copied ? (
                    <Check size={13} className="text-green-500" />
                  ) : (
                    <Copy size={13} />
                  )}
                </button>
              </span>{' '}
              to confirm.
            </p>
            <Input
              id="delete-account-confirmation"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder={CHALLENGE_PHRASE}
              disabled={isDeleting}
              autoComplete="off"
              spellCheck={false}
              className="text-center font-mono text-sm"
            />
          </div>

          {/* Error message */}
          {error && (
            <p className="mt-2 text-xs font-medium text-red-500">{error}</p>
          )}

          {/* Actions */}
          <div className="mt-5 flex w-full gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isDeleting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              id="confirm-delete-account"
              variant="destructive"
              onClick={handleDelete}
              disabled={!isConfirmed || isDeleting}
              className="flex-1"
            >
              {isDeleting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Deleting…
                </>
              ) : (
                'Delete Account'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
