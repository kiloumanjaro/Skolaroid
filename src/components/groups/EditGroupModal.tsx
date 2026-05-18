'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Loader2, Pencil } from 'lucide-react';
import { useUpdateGroup } from '@/lib/hooks/useUpdateGroup';
import { updateGroupServerSchema } from '@/lib/schemas';
import { WOBBLY_RADIUS, WOBBLY_RADIUS_MD } from '@/lib/hand-drawn';
import { type Group } from '@/lib/types/group';

interface EditGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group;
  onUpdated: () => void;
}

export function EditGroupModal({
  open,
  onOpenChange,
  group,
  onUpdated,
}: EditGroupModalProps) {
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateGroup = useUpdateGroup();

  useEffect(() => {
    if (open) {
      setName(group.name);
      setDescription(group.description ?? '');
      setErrors({});
    }
  }, [open, group]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSubmit = () => {
    const payload = {
      name: name.trim() || undefined,
      description: description.trim(),
    };

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

    if (
      parsed.data.name === group.name &&
      (parsed.data.description ?? '') === (group.description ?? '')
    ) {
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
        <DialogTitle className="sr-only">Edit Group</DialogTitle>

        <div className="flex items-center gap-2 border-b border-border px-6 py-4">
          <Pencil className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-kalam text-base font-semibold text-foreground">
            Edit Group
          </h2>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {errors.root && (
            <p className="font-hand text-sm text-destructive">{errors.root}</p>
          )}

          <div className="space-y-1.5">
            <Label
              htmlFor="edit-group-name"
              className="font-hand text-sm font-medium"
            >
              Group Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-group-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors((prev) => ({ ...prev, name: '' }));
              }}
              maxLength={50}
              placeholder="Enter group name"
              className={`font-hand ${errors.name ? 'border-destructive focus-visible:ring-destructive/20' : ''}`}
              style={{ borderRadius: WOBBLY_RADIUS }}
            />
            <div className="flex items-center justify-between">
              {errors.name ? (
                <p className="font-hand text-xs text-destructive">
                  {errors.name}
                </p>
              ) : (
                <span />
              )}
              <span className="font-hand text-xs text-muted-foreground">
                {name.length}/50
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="edit-group-description"
              className="font-hand text-sm font-medium"
            >
              Description
            </Label>
            <textarea
              id="edit-group-description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setErrors((prev) => ({ ...prev, description: '' }));
              }}
              maxLength={500}
              rows={3}
              placeholder="What is this group about?"
              className={`w-full resize-none rounded border border-border bg-background px-3 py-2 font-hand text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring ${errors.description ? 'border-destructive focus:ring-destructive/20' : ''}`}
              style={{ borderRadius: WOBBLY_RADIUS }}
            />
            <div className="flex items-center justify-between">
              {errors.description ? (
                <p className="font-hand text-xs text-destructive">
                  {errors.description}
                </p>
              ) : (
                <span />
              )}
              <span className="font-hand text-xs text-muted-foreground">
                {description.length}/500
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
            disabled={isSaving || !name.trim()}
            className="font-hand"
            style={{ borderRadius: WOBBLY_RADIUS }}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
