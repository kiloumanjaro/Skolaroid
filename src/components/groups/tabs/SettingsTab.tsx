'use client';

import { useState } from 'react';
import { Pencil, Check, X, Loader2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type Group } from '@/lib/types/group';
import { useUpdateGroup } from '@/lib/hooks/useUpdateGroup';
import { updateGroupServerSchema } from '@/lib/schemas';
import { cn } from '@/lib/utils';

interface SettingsTabProps {
  group: Group;
  onUpdated: () => void;
}

type EditingField = 'name' | 'description' | 'message' | null;

export function SettingsTab({ group, onUpdated }: SettingsTabProps) {
  const [editingField, setEditingField] = useState<EditingField>(null);
  const [draft, setDraft] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);

  const updateGroup = useUpdateGroup();

  const startEditing = (field: EditingField) => {
    if (!field) return;
    setEditingField(field);
    setFieldError(null);

    if (field === 'name') setDraft(group.name);
    else if (field === 'description') setDraft(group.description ?? '');
    else if (field === 'message') setDraft(group.message ?? '');
  };

  const cancelEditing = () => {
    setEditingField(null);
    setDraft('');
    setFieldError(null);
  };

  const saveField = () => {
    if (!editingField) return;

    const trimmed = draft.trim();

    // No-op guard: skip network request if the value hasn't changed
    const currentValue =
      editingField === 'name'
        ? group.name
        : editingField === 'description'
          ? (group.description ?? '')
          : (group.message ?? '');
    if (trimmed === currentValue.trim()) {
      cancelEditing();
      return;
    }

    // Validate using the shared schema so constraints stay in one place
    const parsed = updateGroupServerSchema.safeParse({
      [editingField]: trimmed,
    });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'Invalid value');
      return;
    }

    updateGroup.mutate(
      { groupId: group.id, data: parsed.data },
      {
        onSuccess: () => {
          setEditingField(null);
          setDraft('');
          setFieldError(null);
          onUpdated();
        },
        onError: (err) => {
          setFieldError(err.message);
        },
      }
    );
  };

  const isSaving = updateGroup.isPending;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-5 py-3">
        <Settings className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">Settings</span>
      </div>

      <div className="space-y-6 px-5 py-4">
        {/* Group Name */}
        <FieldRow
          label="Group Name"
          value={group.name}
          placeholder="Enter group name"
          isEditing={editingField === 'name'}
          draft={draft}
          error={editingField === 'name' ? fieldError : null}
          isSaving={isSaving}
          maxLength={50}
          onEdit={() => startEditing('name')}
          onDraftChange={setDraft}
          onSave={saveField}
          onCancel={cancelEditing}
        />

        {/* Group Description */}
        <FieldRow
          label="Group Description"
          value={group.description ?? ''}
          emptyText="No description provided"
          placeholder="Enter group description"
          isEditing={editingField === 'description'}
          draft={draft}
          error={editingField === 'description' ? fieldError : null}
          isSaving={isSaving}
          maxLength={500}
          multiline
          onEdit={() => startEditing('description')}
          onDraftChange={setDraft}
          onSave={saveField}
          onCancel={cancelEditing}
        />

        {/* Group Message */}
        <FieldRow
          label="Group Message"
          value={group.message ?? ''}
          emptyText="No message set"
          placeholder="Enter a message for your group members"
          isEditing={editingField === 'message'}
          draft={draft}
          error={editingField === 'message' ? fieldError : null}
          isSaving={isSaving}
          maxLength={300}
          multiline
          onEdit={() => startEditing('message')}
          onDraftChange={setDraft}
          onSave={saveField}
          onCancel={cancelEditing}
        />
      </div>
    </div>
  );
}

/* ─── Inline Editable Field ───────────────────────────────────────── */

interface FieldRowProps {
  label: string;
  value: string;
  emptyText?: string;
  placeholder?: string;
  isEditing: boolean;
  draft: string;
  error: string | null;
  isSaving: boolean;
  maxLength: number;
  multiline?: boolean;
  onEdit: () => void;
  onDraftChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

function FieldRow({
  label,
  value,
  emptyText = 'Not set',
  placeholder,
  isEditing,
  draft,
  error,
  isSaving,
  maxLength,
  multiline,
  onEdit,
  onDraftChange,
  onSave,
  onCancel,
}: FieldRowProps) {
  return (
    <div className="space-y-1.5">
      {/* Label + pencil */}
      <div className="flex items-center gap-2">
        <span className="font-hand text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {!isEditing && (
          <button
            onClick={onEdit}
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label={`Edit ${label}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          {multiline ? (
            <textarea
              value={draft}
              onChange={(e) => onDraftChange(e.target.value)}
              placeholder={placeholder}
              maxLength={maxLength}
              rows={3}
              disabled={isSaving}
              className={cn(
                'w-full resize-none border-2 border-border bg-card px-3 py-2 font-hand text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
                error && 'border-destructive'
              )}
              style={{ borderRadius: 0 }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') onCancel();
              }}
            />
          ) : (
            <Input
              value={draft}
              onChange={(e) => onDraftChange(e.target.value)}
              placeholder={placeholder}
              maxLength={maxLength}
              disabled={isSaving}
              className={cn(
                'border-2 font-hand text-sm',
                error && 'border-destructive'
              )}
              style={{ borderRadius: 0 }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSave();
                if (e.key === 'Escape') onCancel();
              }}
            />
          )}

          {/* Counter + error */}
          <div className="flex items-center justify-between">
            <span className="font-hand text-xs text-muted-foreground">
              {draft.length}/{maxLength}
            </span>
            {error && (
              <span className="font-hand text-xs text-destructive">
                {error}
              </span>
            )}
          </div>

          {/* Save / Cancel */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={onSave}
              disabled={isSaving}
              className="gap-1.5 font-hand"
              style={{ borderRadius: 0 }}
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onCancel}
              disabled={isSaving}
              className="gap-1.5 font-hand"
              style={{ borderRadius: 0 }}
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p
          className={cn(
            'font-hand text-sm leading-relaxed',
            value ? 'text-foreground' : 'italic text-muted-foreground'
          )}
        >
          {value || emptyText}
        </p>
      )}
    </div>
  );
}
