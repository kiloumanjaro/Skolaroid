'use client';

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Mail, Loader2 } from 'lucide-react';
import { useCreateGroup, type GroupResponse } from '@/lib/hooks/useCreateGroup';

// ─── PROPS ──────────────────────────────────────────────────────────

interface CreateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Callback receives the full GroupResponse from the backend.
  // Callers can transform it to their own types as needed.
  onCreated: (group: GroupResponse) => void;
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────

export function CreateGroupModal({
  open,
  onOpenChange,
  onCreated,
}: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [inviteEmails, setInviteEmails] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const createGroup = useCreateGroup();

  const resetForm = useCallback(() => {
    setName('');
    setDescription('');
    setInviteEmails('');
    setErrors({});
  }, []);

  const validateName = useCallback((value: string) => {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      setErrors((prev) => ({ ...prev, name: 'Group name is required' }));
    } else if (trimmed.length > 100) {
      setErrors((prev) => ({
        ...prev,
        name: 'Group name must be 100 characters or less',
      }));
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.name;
        return next;
      });
    }
  }, []);

  const handleNameChange = (value: string) => {
    setName(value);
    validateName(value);
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrors({ name: 'Group name is required' });
      return;
    }
    if (trimmedName.length > 100) {
      setErrors({ name: 'Group name must be 100 characters or less' });
      return;
    }

    createGroup.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
      },
      {
        onSuccess: (data) => {
          onCreated(data);
          handleClose();
        },
        onError: (err) => {
          setErrors({ name: err.message });
        },
      }
    );
  };

  const isDisabled =
    name.trim() === '' || errors.name !== undefined || createGroup.isPending;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent
        className="flex max-w-lg gap-0 overflow-hidden p-0"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Create Group</DialogTitle>

        <div className="flex w-full flex-col">
          {/* Header */}
          <div className="border-b px-6 pb-4 pt-6">
            <h2 className="text-lg font-semibold text-foreground">
              Create Group
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Set up a new group for your batch or community.
            </p>
          </div>

          {/* Scrollable form body */}
          <div className="scrollbar-hide flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {/* Field 1 — Group Name */}
            <div className="space-y-2">
              <Label>
                Group Name <span className="text-red-400">*</span>
              </Label>
              <Input
                placeholder="e.g. BSCS Batch 2023"
                maxLength={100}
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={
                  errors.name ? 'border-red-400 focus-visible:ring-red-400' : ''
                }
              />
              <div className="flex items-center justify-between">
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
                <p className="ml-auto text-right text-xs text-muted-foreground">
                  {name.length}/100
                </p>
              </div>
            </div>

            {/* Field 2 — Description (optional) */}
            <div className="space-y-2">
              <Label>
                Description{' '}
                <span className="text-xs text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <textarea
                rows={3}
                maxLength={500}
                placeholder="Describe what this group is about..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full resize-none border-2 border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <p className="text-right text-xs text-muted-foreground">
                {description.length}/500
              </p>
            </div>

            {/* Field 3 — Invite Users */}
            <div className="space-y-2">
              <Label>
                Invite Members{' '}
                <span className="text-xs text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  className="pl-9"
                  placeholder="Email, comma separated"
                  value={inviteEmails}
                  onChange={(e) => setInviteEmails(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t bg-card px-6 py-4">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isDisabled}
              className="gap-1.5 bg-skolaroid-blue text-white hover:bg-skolaroid-blue/90"
            >
              {createGroup.isPending && (
                <Loader2 size={14} className="animate-spin" />
              )}
              Create Group
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
