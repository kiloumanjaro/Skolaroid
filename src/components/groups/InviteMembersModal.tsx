'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link2, Mail, Copy, Check, Loader2 } from 'lucide-react';
import { useSendInvitations } from '@/lib/hooks/useInvitation';

interface InviteMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupName: string;
  groupId: string;
  showSuccess: (message: string) => void;
}

export function InviteMembersModal({
  open,
  onOpenChange,
  groupName,
  groupId,
  showSuccess,
}: InviteMembersModalProps) {
  const [emails, setEmails] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const sendInvitations = useSendInvitations();

  // TODO: Replace with real invite link generation via API
  const inviteLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${groupId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      showSuccess('Invite link copied!');
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Fallback: select the text for manual copy
    }
  };

  const handleSendInvites = async () => {
    console.log('Sending invites to:', emails);
    console.log(
      'Parsed emails:',
      emails
        .split(',')
        .map((e) => e.trim())
        .filter((e) => e.length > 0)
    );
    console.log('Group ID:', groupId);
    if (!emails.trim()) return;

    const emailList = emails
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0);

    if (emailList.length === 0) return;

    try {
      const results = await sendInvitations.mutateAsync({
        groupId,
        emails: emailList,
      });
      showSuccess(`${results.length} invitation(s) sent!`);
      setEmails('');
      onOpenChange(false);
    } catch {
      // Error is shown through the mutation state
    }
  };

  const handleClose = () => {
    setEmails('');
    setLinkCopied(false);
    sendInvitations.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent
        className="max-h-[90vh] w-[calc(100%-2rem)] max-w-sm gap-0 overflow-hidden p-0"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">
          Invite Members to {groupName}
        </DialogTitle>

        <div className="flex min-w-0 flex-col overflow-y-auto">
          {/* Header */}
          <div className="px-6 pb-1 pt-6">
            <h2 className="font-kalam text-base font-semibold text-foreground">
              Invite Members
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Share a link or invite people by email.
            </p>
          </div>

          {/* Invite Link */}
          <div className="min-w-0 space-y-2 px-6 pt-4">
            <label className="text-xs font-medium text-muted-foreground">
              Invite Link
            </label>
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden border-2 border-border bg-secondary px-3 py-2.5">
                <Link2 size={14} className="shrink-0 text-muted-foreground" />
                <span className="truncate text-xs text-foreground">
                  {inviteLink}
                </span>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
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

          {/* Email Invites */}
          <div className="space-y-2 px-6 pt-4">
            <label className="text-xs font-medium text-muted-foreground">
              Invite by Email
            </label>
            <div className="relative">
              <Mail
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                className="border-border bg-secondary pl-9 text-xs"
                placeholder="email@example.com, comma separated"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col gap-2 px-6 pb-6 pt-5">
            {sendInvitations.isError && (
              <p className="text-xs text-red-500">
                {sendInvitations.error?.message ?? 'Failed to send invitations'}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSendInvites}
                disabled={!emails.trim() || sendInvitations.isPending}
              >
                {sendInvitations.isPending && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                Send Invites
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
