# OPUS MASTER DIRECTIVE — GROUP-2 & GROUP-3: Group Edit Modal + Admin Batch Message

> **You are operating in Agent Mode. Execute every step automatically. Do not ask the user to create files. Do not skip steps. Do not leave TODOs unless explicitly marked as future integration points.**

---

## 1. SYSTEM CONTEXT

**Stack:** Next.js 15 App Router · TypeScript 5 · Tailwind CSS v3 · shadcn/ui (new-york) · Radix UI primitives · Lucide React · Zod v4 · TanStack Query v5 · Supabase auth · Prisma ORM (PostgreSQL)

**Design tokens:**

- `--background: #fdfbf7`, `--foreground: #2d2d2d`, `--card: #ffffff`, `--border: #2d2d2d`, `--muted: #e5e0d8`, `--muted-foreground`, `--primary: #3F83DB`, `--destructive`
- Fonts: `font-kalam` (headings), `font-hand` (all UI text, inputs, buttons, labels)
- Shadows: hard offset only — `shadow-[4px_4px_0px_0px_#2d2d2d]`. No blur.
- `WOBBLY_RADIUS` / `WOBBLY_RADIUS_MD` from `@/lib/hand-drawn` — apply via `style={{ borderRadius: WOBBLY_RADIUS }}`
- `rounded-full` only for avatars. All other panels use wobbly inline style.
- Button press: `active:shadow-none active:translate-x-[4px] active:translate-y-[4px]`

**UI primitives:** `Dialog`, `DialogContent`, `DialogTitle`, `Button`, `Input`, `Label`, `Textarea` (if available, else `<textarea>` with `Input` classes) from `src/components/ui/`

**`DialogContent` custom prop:** `showCloseButton={false}` — always pass this. Use your own cancel button.

**`DialogContent` layout pattern (copy exactly):**

```tsx
<DialogContent
  className="flex max-w-md flex-col gap-0 overflow-hidden p-0"
  showCloseButton={false}
>
  <DialogTitle className="sr-only">…</DialogTitle>
  {/* Scrollable body */}
  <div className="flex-1 space-y-5 overflow-y-auto p-6">…</div>
  {/* Pinned footer */}
  <div className="flex justify-end gap-3 border-t border-border bg-card px-6 py-4">
    …
  </div>
</DialogContent>
```

**Form validation pattern:** Zod `.safeParse()` → iterate `.error.issues` → `Record<string, string>` state → `<p className="mt-1 text-xs text-destructive font-hand">{errors.field}</p>` inline. Apply `border-destructive` on errored inputs.

**Key existing files (read before editing):**

- `src/components/groups/GroupPanel.tsx` — main panel; wires all modals and handles group state
- `src/components/groups/tabs/SettingsTab.tsx` — inline editing for OWNER (name, description, message)
- `src/app/api/prisma/group/[groupId]/route.ts` — GET + PATCH (currently OWNER-only)
- `src/lib/hooks/useUpdateGroup.ts` — `useUpdateGroup()` TanStack mutation for PATCH
- `src/lib/schemas.ts` — `updateGroupServerSchema` (name: max 50, description: max 500, message: max 300)
- `src/lib/types/group.ts` — `Group`, `GroupMember`, `GroupMemberRole` interfaces
- `src/lib/group-permissions.ts` — `canRoleUsePermission()`, `GROUP_ROLES`, `GroupMemberRole`
- `src/components/groups/index.ts` — barrel exports for groups components

**Roles:** `OWNER` | `ADMIN` | `MEMBER`. `isOwner = currentUserRole === 'OWNER'`. `canRoleUsePermission(rolePrivileges, role, 'editContent')` returns boolean.

**`GroupPanel` state already has:** `selectedGroup`, `currentUserRole`, `isOwner`, `canManageMembers`, `refetchGroupDetail`, `showSuccess`, `showError`, `useGroupToast`.

---

## 2. FEATURE PRD

### GROUP-2: Group Edit Modal (Owner only)

A dedicated modal that lets the group **owner** update the group **name** and **description**. This is separate from the existing inline `SettingsTab` — it's an accessible quick-edit action from the header actions dropdown.

**Fields:** `name` (required, max 50 chars) · `description` (optional, max 500 chars, multiline)
**Access:** `isOwner === true` only
**API:** PATCH `/api/prisma/group/${groupId}` (already exists) — no backend change required for this feature.
**Hook:** `useUpdateGroup()` (already exists)

### GROUP-3: Admin Batch Message Edit

**Admins** (role = `ADMIN`) of a group should be able to update the group **message** field. Currently the PATCH API blocks all non-OWNER roles. The message is a pinned callout visible in `AboutTab`.

**Field:** `message` (optional, max 300 chars, multiline)
**Access:** `ADMIN` or `OWNER`
**API change required:** PATCH route must be updated to allow ADMIN role to update `message` only. If an ADMIN tries to change `name` or `description`, return 403.
**Hook:** same `useUpdateGroup()` — no hook changes needed.
**New UI:** A dedicated `EditGroupMessageModal.tsx`, accessible from the actions dropdown to users with role `OWNER` or `ADMIN`.

---

## 3. WORKFLOW MAP (execute in order)

```
Step 1 → PATCH route.ts     — extend authorization to allow ADMIN to update message only
Step 2 → EditGroupModal     — create new modal (GROUP-2, owner: name + description)
Step 3 → EditGroupMessage   — create new modal (GROUP-3, owner+admin: message only)
Step 4 → index.ts           — export both new modals
Step 5 → GroupPanel.tsx     — wire both modals: state, handlers, dropdown items
```

---

## 4. STEP-BY-STEP EXECUTION

---

### STEP 1 — Update PATCH Route (`src/app/api/prisma/group/[groupId]/route.ts`)

**Current behavior:** rejects all non-OWNER roles with 403.

**New behavior:**

- `OWNER` → may update `name`, `description`, `message` (unchanged)
- `ADMIN` → may update `message` ONLY. If the request body contains `name` or `description` (non-undefined), return `{ error: 'Only the group owner can update name or description' }` with status 403.
- `MEMBER` or unauthenticated → 403 (unchanged)

Locate the authorization block (after `resolveGroupMemberRole`):

```ts
if (currentUserRole !== 'OWNER') {
  return NextResponse.json(
    { error: 'Only the group owner can update settings' },
    { status: 403 }
  );
}
```

Replace with:

```ts
if (currentUserRole !== 'OWNER' && currentUserRole !== 'ADMIN') {
  return NextResponse.json(
    { error: 'Only group owners or admins can update settings' },
    { status: 403 }
  );
}

// ADMINs may only update the message field
if (currentUserRole === 'ADMIN') {
  const bodyKeys = Object.keys(body ?? {}).filter((k) => body[k] !== undefined);
  const forbidden = bodyKeys.filter((k) => k === 'name' || k === 'description');
  if (forbidden.length > 0) {
    return NextResponse.json(
      { error: 'Only the group owner can update name or description' },
      { status: 403 }
    );
  }
}
```

> **Note:** The `body` variable is already declared above this block via `const body = await request.json()`. Place this new block immediately before the `safeParse` call.

---

### STEP 2 — Create `src/components/groups/EditGroupModal.tsx` (GROUP-2)

**Purpose:** Modal for group OWNER to edit group name and description.

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

  // Sync form when group changes (e.g. refetch)
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
      description: description.trim() || undefined,
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

    // No-op guard
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

        {/* Header */}
        <div className="flex items-center gap-2 border-b border-border px-6 py-4">
          <Pencil className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-kalam text-base font-semibold text-foreground">
            Edit Group
          </h2>
        </div>

        {/* Body */}
        <div className="space-y-5 p-6">
          {/* Root error */}
          {errors.root && (
            <p className="font-hand text-sm text-destructive">{errors.root}</p>
          )}

          {/* Name */}
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

          {/* Description */}
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

        {/* Footer */}
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
                Saving…
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
```

---

### STEP 3 — Create `src/components/groups/EditGroupMessageModal.tsx` (GROUP-3)

**Purpose:** Modal for OWNER or ADMIN to edit the group message (pinned callout).

```tsx
'use client';

import { useState, useEffect } from 'react';
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

    // No-op guard
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

        {/* Header */}
        <div className="flex items-center gap-2 border-b border-border px-6 py-4">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-kalam text-base font-semibold text-foreground">
            Group Message
          </h2>
        </div>

        {/* Body */}
        <div className="space-y-4 p-6">
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
              placeholder="Write a message for your group members…"
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

        {/* Footer */}
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
                Saving…
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
```

---

### STEP 4 — Update `src/components/groups/index.ts`

Add these two exports to the existing barrel file:

```ts
export * from './EditGroupModal';
export * from './EditGroupMessageModal';
```

---

### STEP 5 — Update `src/components/groups/GroupPanel.tsx`

This is the most involved edit. Read the full file before making changes.

#### 5a. Add imports (top of file, alongside existing modal imports)

```ts
import { EditGroupModal } from '@/components/groups/EditGroupModal';
import { EditGroupMessageModal } from '@/components/groups/EditGroupMessageModal';
```

Also add `Pencil` and `MessageSquarePen` to the Lucide import block:

```ts
import {
  // ...existing icons...
  Pencil,
  MessageSquarePen,
} from 'lucide-react';
```

#### 5b. Add modal state (inside `GroupPanel` function, alongside existing state)

```ts
const [editGroupModalOpen, setEditGroupModalOpen] = useState(false);
const [editMessageModalOpen, setEditMessageModalOpen] = useState(false);
```

#### 5c. Add permission derived state (alongside existing `isOwner`, `canManageMembers`)

```ts
const canEditMessage =
  !!selectedGroup &&
  (currentUserRole === 'OWNER' || currentUserRole === 'ADMIN');
```

#### 5d. Add handlers (alongside existing handlers)

```ts
const handleGroupUpdated = useCallback(() => {
  refetchGroupDetail();
  showSuccess('Group updated successfully.');
}, [refetchGroupDetail, showSuccess]);

const handleMessageUpdated = useCallback(() => {
  refetchGroupDetail();
  showSuccess('Group message updated.');
}, [refetchGroupDetail, showSuccess]);
```

#### 5e. Wire "Edit Group" dropdown item (owner only)

Inside the `<DropdownMenuContent>`, add an "Edit Group" item **before** the "Invite Members" block (i.e., at the very top of the dropdown, as the first item). Show it only to the owner:

```tsx
{
  isOwner && (
    <>
      <DropdownMenuItem onClick={() => setEditGroupModalOpen(true)}>
        <Pencil className="mr-2 h-4 w-4" />
        Edit Group
      </DropdownMenuItem>
      <DropdownMenuSeparator />
    </>
  );
}
```

#### 5f. Wire "Edit Message" dropdown item (owner + admin)

Add it after the "Share Group" item and its separator, before the "Leave Group" item:

```tsx
{
  canEditMessage && (
    <>
      <DropdownMenuItem onClick={() => setEditMessageModalOpen(true)}>
        <MessageSquarePen className="mr-2 h-4 w-4" />
        Edit Message
      </DropdownMenuItem>
      <DropdownMenuSeparator />
    </>
  );
}
```

#### 5g. Render the two new modals in the nested modals section

Inside the `{selectedGroup && ( <> ... </> )}` block at the bottom, add after the existing modals:

```tsx
<EditGroupModal
  open={editGroupModalOpen}
  onOpenChange={setEditGroupModalOpen}
  group={selectedGroup}
  onUpdated={handleGroupUpdated}
/>

<EditGroupMessageModal
  open={editMessageModalOpen}
  onOpenChange={setEditMessageModalOpen}
  group={selectedGroup}
  onUpdated={handleMessageUpdated}
/>
```

---

## 5. CONSTRAINTS CHECKLIST

- [ ] `EditGroupModal` only ever renders for `isOwner === true` (enforced by dropdown visibility + API)
- [ ] `EditGroupMessageModal` only ever renders when `canEditMessage === true` (OWNER or ADMIN)
- [ ] PATCH API must validate: ADMIN requests are rejected if body includes `name` or `description`
- [ ] No existing component is refactored. SettingsTab inline editing is untouched.
- [ ] No new Prisma migrations required — `message` field already exists on `PrivateGroup`
- [ ] All text uses `font-hand`; headings use `font-kalam`
- [ ] `showCloseButton={false}` on all `DialogContent` instances
- [ ] Character counters visible on all textareas
- [ ] No-op guard prevents empty network requests when value is unchanged

---

## 6. COMMIT MESSAGE

```
add group edit modal and admin message editing
```

---

## 7. PR DESCRIPTION

**Group Edit Modal & Admin Message Editing**

1. Added a dedicated edit modal for group owners to update group name and description via an "Edit Group" action in the header dropdown.
2. Extended the group PATCH API to allow ADMIN-role members to update the message field; name and description remain owner-only.
3. Added a message edit modal accessible to both OWNER and ADMIN roles via an "Edit Message" dropdown action.
4. Wired both new modals into `GroupPanel` with separate state, handlers, and conditional dropdown entries gated by role.
5. ADMIN access is double-enforced: frontend gates on `currentUserRole`, backend rejects forbidden fields with a 403.
6. No-op guards on both modals prevent unnecessary PATCH requests when values are unchanged.
7. All form inputs include character counters and inline Zod-validated error messages.

**File Locations**

- Items 1, 7: `src/components/groups/EditGroupModal.tsx` (new)
- Items 3, 7: `src/components/groups/EditGroupMessageModal.tsx` (new)
- Item 2, 5: `src/app/api/prisma/group/[groupId]/route.ts`
- Items 4, 5, 6: `src/components/groups/GroupPanel.tsx`
- Item 4: `src/components/groups/index.ts`
