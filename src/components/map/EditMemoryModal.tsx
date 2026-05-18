'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import {
  Globe,
  GraduationCap,
  Users,
  Lock,
  ChevronDown,
  Loader2,
  Info,
} from 'lucide-react';
import { useUpdateMemory } from '@/lib/hooks/useUpdateMemory';
import { useUserGroups } from '@/lib/hooks/useUserGroups';
import type { MemoryVisibility } from '@/lib/schemas';
import type { MemoryWithCoordinates } from '@/lib/hooks/useAllMemoriesWithCoordinates';
import { WOBBLY_RADIUS_MD } from '@/lib/hand-drawn';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EDIT_VISIBILITY_OPTIONS: {
  value: MemoryVisibility;
  label: string;
  description: string;
  icon: typeof Globe;
}[] = [
  {
    value: 'PUBLIC',
    label: 'Public',
    description: 'Everyone can see this memory',
    icon: Globe,
  },
  {
    value: 'PROGRAM_ONLY',
    label: 'Program Only',
    description: 'Visible to your program',
    icon: GraduationCap,
  },
  {
    value: 'BATCH_ONLY',
    label: 'Batch Only',
    description: 'Visible to your batch',
    icon: Users,
  },
  {
    value: 'GROUP_ONLY',
    label: 'Private',
    description: 'Visible to selected group only',
    icon: Lock,
  },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface EditMemoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memory: MemoryWithCoordinates;
  onMemoryUpdated?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EditMemoryModal({
  open,
  onOpenChange,
  memory,
  onMemoryUpdated,
}: EditMemoryModalProps) {
  // ── State ──────────────────────────────────────────────────────────────
  const [description, setDescription] = useState(memory.description ?? '');
  const [visibility, setVisibility] = useState<MemoryVisibility>(
    memory.visibility
  );
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(
    memory.privateGroupId ?? null
  );
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibilityRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);

  // ── Hooks ──────────────────────────────────────────────────────────────
  const updateMemory = useUpdateMemory();
  const { data: userGroups, isLoading: isLoadingGroups } = useUserGroups();
  const hasGroups = (userGroups?.length ?? 0) > 0;

  // ── Sync state when memory changes or modal opens ─────────────────────
  useEffect(() => {
    if (open) {
      setDescription(memory.description ?? '');
      setVisibility(memory.visibility);
      setSelectedGroupId(memory.privateGroupId ?? null);
      setError(null);
      setShowVisibilityDropdown(false);
      setShowGroupDropdown(false);
    }
  }, [open, memory]);

  // ── Click-outside detection ───────────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        visibilityRef.current &&
        !visibilityRef.current.contains(e.target as Node)
      ) {
        setShowVisibilityDropdown(false);
      }
      if (groupRef.current && !groupRef.current.contains(e.target as Node)) {
        setShowGroupDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────
  const currentOption =
    EDIT_VISIBILITY_OPTIONS.find((o) => o.value === visibility) ??
    EDIT_VISIBILITY_OPTIONS[0];
  const CurrentIcon = currentOption.icon;

  const selectedGroup = userGroups?.find((g) => g.id === selectedGroupId);

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleVisibilitySelect = (value: MemoryVisibility) => {
    setVisibility(value);
    setShowVisibilityDropdown(false);
    setError(null);

    // Reset group when switching away from GROUP_ONLY
    if (value !== 'GROUP_ONLY') {
      setSelectedGroupId(null);
    }
  };

  const handleGroupSelect = (groupId: string) => {
    setSelectedGroupId(groupId);
    setShowGroupDropdown(false);
    setError(null);
  };

  const handleSave = () => {
    if (visibility === 'GROUP_ONLY' && !selectedGroupId) {
      setError('Please select a group for private visibility');
      return;
    }

    updateMemory.mutate(
      {
        memoryId: memory.id,
        description: description.trim() || undefined,
        visibility,
        privateGroupId: visibility === 'GROUP_ONLY' ? selectedGroupId : null,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          onMemoryUpdated?.();
        },
        onError: (err) => {
          setError(
            err instanceof Error ? err.message : 'Failed to update memory'
          );
        },
      }
    );
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="border-2 shadow-[6px_6px_0px_0px_#2d2d2d] sm:max-w-md"
        style={{ borderRadius: WOBBLY_RADIUS_MD }}
      >
        <DialogHeader>
          <DialogTitle className="font-kalam text-xl">Edit Memory</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Description */}
          <div>
            <label
              htmlFor="edit-description"
              className="mb-1.5 block font-hand text-sm font-medium text-foreground"
            >
              Description
            </label>
            <textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={5000}
              placeholder="Describe this memory..."
              className="min-h-[100px] w-full border-2 border-border bg-card px-3 py-2 font-hand text-sm text-foreground placeholder:text-muted-foreground focus:border-skolaroid-blue focus:outline-none focus:ring-1 focus:ring-skolaroid-blue"
              style={{ borderRadius: WOBBLY_RADIUS_MD }}
            />
          </div>

          {/* Visibility dropdown */}
          <div>
            <label className="mb-1.5 block font-hand text-sm font-medium text-foreground">
              Visibility
            </label>
            <div ref={visibilityRef} className="relative">
              <button
                type="button"
                onClick={() =>
                  setShowVisibilityDropdown(!showVisibilityDropdown)
                }
                className={cn(
                  'flex w-full items-center justify-between border-2 border-border bg-card px-3 py-2.5 font-hand text-sm transition-colors',
                  showVisibilityDropdown &&
                    'border-skolaroid-blue ring-1 ring-skolaroid-blue'
                )}
                style={{ borderRadius: WOBBLY_RADIUS_MD }}
              >
                <span className="flex items-center gap-2">
                  <CurrentIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{currentOption.label}</span>
                </span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-muted-foreground transition-transform',
                    showVisibilityDropdown && 'rotate-180'
                  )}
                />
              </button>

              {showVisibilityDropdown && (
                <div
                  className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden border-2 border-border bg-card shadow-[4px_4px_0px_0px_#2d2d2d]"
                  style={{ borderRadius: WOBBLY_RADIUS_MD }}
                >
                  {EDIT_VISIBILITY_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isDisabled =
                      option.value === 'GROUP_ONLY' && !hasGroups;
                    const isSelected = option.value === visibility;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => handleVisibilitySelect(option.value)}
                        className={cn(
                          'flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors',
                          isSelected && 'bg-blue-50',
                          !isDisabled && !isSelected && 'hover:bg-secondary',
                          isDisabled && 'cursor-not-allowed opacity-50'
                        )}
                      >
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="font-hand text-sm font-medium text-foreground">
                            {option.label}
                          </p>
                          <p className="font-hand text-xs text-muted-foreground">
                            {option.description}
                          </p>
                        </div>
                        {isDisabled && (
                          <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Group selector (shown when Private/GROUP_ONLY is selected) */}
          {visibility === 'GROUP_ONLY' && (
            <div>
              <label className="mb-1.5 block font-hand text-sm font-medium text-foreground">
                Select Group
              </label>
              <div ref={groupRef} className="relative">
                <button
                  type="button"
                  onClick={() => setShowGroupDropdown(!showGroupDropdown)}
                  disabled={isLoadingGroups}
                  className={cn(
                    'flex w-full items-center justify-between border-2 border-border bg-card px-3 py-2.5 font-hand text-sm transition-colors',
                    showGroupDropdown &&
                      'border-skolaroid-blue ring-1 ring-skolaroid-blue'
                  )}
                  style={{ borderRadius: WOBBLY_RADIUS_MD }}
                >
                  <span className="text-foreground">
                    {isLoadingGroups
                      ? 'Loading groups...'
                      : selectedGroup
                        ? selectedGroup.name
                        : 'Choose a group...'}
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-muted-foreground transition-transform',
                      showGroupDropdown && 'rotate-180'
                    )}
                  />
                </button>

                {showGroupDropdown && userGroups && (
                  <div
                    className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto border-2 border-border bg-card shadow-[4px_4px_0px_0px_#2d2d2d]"
                    style={{ borderRadius: WOBBLY_RADIUS_MD }}
                  >
                    {userGroups.length === 0 ? (
                      <p className="px-3 py-3 text-center font-hand text-sm text-muted-foreground">
                        No groups available
                      </p>
                    ) : (
                      userGroups.map((group) => (
                        <button
                          key={group.id}
                          type="button"
                          onClick={() => handleGroupSelect(group.id)}
                          className={cn(
                            'flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors',
                            selectedGroupId === group.id
                              ? 'bg-blue-50'
                              : 'hover:bg-secondary'
                          )}
                        >
                          <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-hand text-sm font-medium text-foreground">
                              {group.name}
                            </p>
                            <p className="font-hand text-xs text-muted-foreground">
                              {group._count.members} member
                              {group._count.members !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2">
              <p className="font-hand text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateMemory.isPending}
            className="border-2 font-hand"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMemory.isPending}
            className="border-2 bg-skolaroid-blue font-hand text-white shadow-[3px_3px_0px_0px_#2d2d2d] hover:bg-skolaroid-blue/90"
          >
            {updateMemory.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
