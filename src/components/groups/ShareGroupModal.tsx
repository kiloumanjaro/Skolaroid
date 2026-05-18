'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Link2, Copy, Check, Loader2, RefreshCw } from 'lucide-react';
import { useCreateInvitationLink } from '@/lib/hooks/useInvitation';

interface ShareGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupName: string;
  groupId: string;
  showSuccess: (message: string) => void;
}

export function ShareGroupModal({
  open,
  onOpenChange,
  groupName,
  groupId,
  showSuccess,
}: ShareGroupModalProps) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [maxUses, setMaxUses] = useState(10);
  const createInvitationLink = useCreateInvitationLink();

  const handleGenerateLink = async () => {
    try {
      const result = await createInvitationLink.mutateAsync({
        groupId,
        maxUses,
      });
      setGeneratedLink(result.inviteLink);
      showSuccess('Invite link generated!');
    } catch {
      // Error is shown through the mutation state
    }
  };

  const handleCopyLink = async () => {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      setLinkCopied(true);
      showSuccess('Link copied to clipboard!');
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleClose = () => {
    setLinkCopied(false);
    setGeneratedLink('');
    setMaxUses(10);
    createInvitationLink.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent
        className="max-h-[90vh] w-[calc(100%-2rem)] max-w-sm gap-0 overflow-hidden p-0"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Share {groupName}</DialogTitle>

        <div className="flex min-w-0 flex-col">
          {/* Header */}
          <div className="px-6 pb-1 pt-6">
            <h2 className="font-kalam text-base font-semibold text-foreground">
              Share Group
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Generate a public invite link for this group.
            </p>
          </div>

          {/* Max uses + Generate */}
          <div className="min-w-0 space-y-2 px-6 pt-4">
            <label className="text-xs font-medium text-muted-foreground">
              Invite Link
            </label>

            <div className="flex min-w-0 items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="shrink-0 text-xs text-muted-foreground">
                  Max uses:
                </span>
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  className="h-8 w-20 border-border bg-secondary text-center text-xs"
                  value={maxUses}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val >= 1 && val <= 1000) {
                      setMaxUses(val);
                    }
                  }}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateLink}
                disabled={createInvitationLink.isPending}
                className="shrink-0"
              >
                {createInvitationLink.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <RefreshCw size={14} />
                )}
                Generate
              </Button>
            </div>

            {/* Generated link display + copy */}
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden border-2 border-border bg-secondary px-3 py-2.5">
                <Link2 size={14} className="shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-xs text-foreground">
                  {generatedLink || 'Click Generate to create a link'}
                </span>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                disabled={!generatedLink}
                aria-label="Copy invite link"
              >
                {linkCopied ? (
                  <Check size={15} className="text-green-500" />
                ) : (
                  <Copy size={15} />
                )}
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col gap-2 px-6 pb-6 pt-5">
            {createInvitationLink.isError && (
              <p className="text-xs text-red-500">
                {createInvitationLink.error?.message ??
                  'Failed to generate invitation link'}
              </p>
            )}
            <div className="flex justify-end">
              <Button variant="ghost" onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
