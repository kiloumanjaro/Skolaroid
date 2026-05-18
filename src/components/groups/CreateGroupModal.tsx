'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { WOBBLY_RADIUS_MD } from '@/lib/hand-drawn';
import {
  Globe,
  Lock,
  Eye,
  EyeOff,
  ChevronDown,
  Mail,
  Info,
  Loader2,
} from 'lucide-react';
import {
  type GroupPrivacy,
  type GroupVisibility,
  createGroupSchema,
} from '@/lib/types/group';
import { useCreateGroup, type GroupResponse } from '@/lib/hooks/useCreateGroup';

// ─── PROPS ──────────────────────────────────────────────────────────

interface CreateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Callback receives the full GroupResponse from the backend.
  // Callers can transform it to their own types as needed.
  onCreated: (group: GroupResponse) => void;
}

// ─── CUSTOM DROPDOWN COMPONENT ──────────────────────────────────────

interface DropdownOption<T extends string> {
  value: T;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface CustomDropdownProps<T extends string> {
  label: string;
  tooltip: string;
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

function CustomDropdown<T extends string>({
  label,
  tooltip,
  options,
  value,
  onChange,
}: CustomDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Label>{label}</Label>
        <div
          className="relative"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <Info size={14} className="cursor-help text-muted-foreground" />
          {showTooltip && (
            <div
              className="absolute bottom-full left-1/2 z-30 mb-2 w-56 -translate-x-1/2 border-2 border-border bg-card px-3 py-2 text-xs text-muted-foreground shadow-[3px_3px_0px_0px_#2d2d2d]"
              style={{ borderRadius: WOBBLY_RADIUS_MD }}
            >
              {tooltip}
            </div>
          )}
        </div>
      </div>

      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between border-2 border-input bg-transparent px-3 py-2 text-sm transition-colors hover:bg-secondary"
        >
          <span className="flex items-center gap-2">
            {selected?.icon}
            <span>{selected?.label}</span>
          </span>
          <ChevronDown
            size={16}
            className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <div
            className="absolute left-0 top-full z-20 mt-1 w-full overflow-hidden border-2 border-border bg-card shadow-[3px_3px_0px_0px_#2d2d2d]"
            style={{ borderRadius: WOBBLY_RADIUS_MD }}
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary ${
                  value === option.value
                    ? 'border-l-2 border-skolaroid-blue bg-skolaroid-blue/5'
                    : 'border-l-2 border-transparent'
                }`}
              >
                <span className="mt-0.5 shrink-0 text-skolaroid-blue">
                  {option.icon}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-foreground">
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                    {option.description}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PRIVACY/VISIBILITY OPTIONS ─────────────────────────────────────

const privacyOptions: DropdownOption<GroupPrivacy>[] = [
  {
    value: 'PUBLIC',
    label: 'Public',
    description:
      "Anyone can see who's in the group and what they post. Depending on your group's size and age, you might be able to change to private later.",
    icon: <Globe size={20} />,
  },
  {
    value: 'PRIVATE',
    label: 'Private',
    description:
      "Only members can see who's in the group and what they post. You might be able to change to public later.",
    icon: <Lock size={20} />,
  },
];

const visibilityOptions: DropdownOption<GroupVisibility>[] = [
  {
    value: 'VISIBLE',
    label: 'Visible',
    description: 'Anyone can find this group.',
    icon: <Eye size={20} />,
  },
  {
    value: 'HIDDEN',
    label: 'Hidden',
    description: 'Only members can find this group.',
    icon: <EyeOff size={20} />,
  },
];

// ─── MAIN COMPONENT ─────────────────────────────────────────────────

export function CreateGroupModal({
  open,
  onOpenChange,
  onCreated,
}: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<GroupPrivacy>('PUBLIC');
  const [visibility, setVisibility] = useState<GroupVisibility>('VISIBLE');
  const [inviteEmails, setInviteEmails] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const createGroup = useCreateGroup();

  const resetForm = useCallback(() => {
    setName('');
    setDescription('');
    setPrivacy('PUBLIC');
    setVisibility('VISIBLE');
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
    const result = createGroupSchema.safeParse({
      name,
      description: description || undefined,
      privacy,
      visibility,
      inviteEmails,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
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

            {/* Field 3 — Choose Privacy */}
            <CustomDropdown
              label="Choose Privacy"
              tooltip="Privacy controls who can see group content and members."
              options={privacyOptions}
              value={privacy}
              onChange={setPrivacy}
            />

            {/* Field 4 — Choose Visibility */}
            <CustomDropdown
              label="Choose Visibility"
              tooltip="Visibility controls whether people can find this group in search."
              options={visibilityOptions}
              value={visibility}
              onChange={setVisibility}
            />

            {/* Field 5 — Invite Users */}
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
