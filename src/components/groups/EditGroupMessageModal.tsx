'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, MessageSquare } from 'lucide-react';
import { useUpdateGroup } from '@/lib/hooks/useUpdateGroup';
import { updateGroupServerSchema } from '@/lib/schemas';
import { WOBBLY_RADIUS, WOBBLY_RADIUS_MD } from '@/lib/hand-drawn';
import { type Group } from '@/lib/types/group';

interface EditGroupMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group;
  onUpdated: () => void;
}

export function EditGroupMessageModal({
  open,
  onOpenChange,
  group,
  onUpdated,
}: EditGroupMessageModalProps) {
  const [message, setMessage] = useState(group.message ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateGroup = useUpdateGroup();

  useEffect(() => {
    if (open) {
      setMessage(group.message ?? '');
      setErrors({});
    }
  }, [open, group]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSubmit = () => {
    const payload = { message: message.trim() };

    const parsed = updateGroupServerSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]?.toString() ?? 'root';
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    if (parsed.data.message === (group.message ?? '')) {
      handleClose();
      return;
    }

    updateGroup.mutate(
      { groupId: group.id, data: parsed.data },
      {
        onSuccess: () => {
          onUpdated();
          handleClose();
        },
        onError: (err) => {
          setErrors({ root: err.message });
        },
      }
    );
  };

  const isSaving = updateGroup.isPending;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent
        className="flex max-w-md flex-col gap-0 overflow-hidden p-0"
        showCloseButton={false}
        style={{ borderRadius: WOBBLY_RADIUS_MD }}
      >
        <DialogTitle className="sr-only">Edit Group Message</DialogTitle>

        <div className="flex items-center gap-2 border-b border-border px-6 py-4">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-kalam text-base font-semibold text-foreground">
            Group Message
          </h2>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          <p className="font-hand text-sm text-muted-foreground">
            This message is pinned for all group members. Keep it short and
            relevant.
          </p>

          {errors.root && (
            <p className="font-hand text-sm text-destructive">{errors.root}</p>
          )}

          <div className="space-y-1.5">
            <Label
              htmlFor="edit-group-message"
              className="font-hand text-sm font-medium"
            >
              Message
            </Label>
            <textarea
              id="edit-group-message"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setErrors((prev) => ({ ...prev, message: '' }));
              }}
              maxLength={300}
              rows={4}
              placeholder="Write a message for your group members..."
              className={`w-full resize-none rounded border border-border bg-background px-3 py-2 font-hand text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring ${errors.message ? 'border-destructive focus:ring-destructive/20' : ''}`}
              style={{ borderRadius: WOBBLY_RADIUS }}
            />
            <div className="flex items-center justify-between">
              {errors.message ? (
                <p className="font-hand text-xs text-destructive">
                  {errors.message}
                </p>
              ) : (
                <span />
              )}
              <span className="font-hand text-xs text-muted-foreground">
                {message.length}/300
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-border bg-card px-6 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={isSaving}
            className="font-hand"
            style={{ borderRadius: WOBBLY_RADIUS }}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSaving}
            className="font-hand"
            style={{ borderRadius: WOBBLY_RADIUS }}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Message'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
