# OPUS MASTER DIRECTIVE — SCRUM-60: Group Creation & Management UI

> **You are operating in Agent Mode. Execute every step automatically. Do not ask the user to create files. Do not skip steps. Do not leave TODOs unless explicitly marked as future integration points.**

---

## 1. SYSTEM CONTEXT

**Stack:** Next.js 15 App Router · TypeScript 5 · Tailwind CSS v3 · shadcn/ui (new-york) · Radix UI primitives · Framer Motion v12 · Lucide React · Zod v4 · TanStack Query v5 · Supabase auth · `useRouter` / `usePathname` from `next/navigation`

**Brand color:** `skolaroid-blue` = `#3F83DB` — used as `bg-skolaroid-blue`, `text-skolaroid-blue`, `hover:bg-skolaroid-blue/90`, `bg-skolaroid-blue/10`

**CSS variables (HSL):** `--background`, `--foreground`, `--muted`, `--muted-foreground`, `--border`, `--destructive`, `--ring`, `--radius: 0.5rem`

**All shadcn UI primitives live at** `src/components/ui/` — import `Dialog`, `DialogContent`, `DialogTitle`, `DialogHeader`, `DialogFooter`, `DialogClose`, `DialogPortal`, `DialogOverlay`, `DialogTrigger`, `Button`, `Input`, `Label`, `Badge`, `Avatar`, `Checkbox`, `DropdownMenu` etc. from there.

**`DialogContent` custom prop:** `showCloseButton?: boolean` (default `true`) — always pass `showCloseButton={false}` and use your own cancel buttons, matching every other modal.

**Modal layout pattern** (copy exactly):

```
<DialogContent className="flex h-[XXX] max-w-[XXX] gap-0 overflow-hidden p-0" showCloseButton={false}>
  <DialogTitle className="sr-only">…</DialogTitle>
  {/* Optional left sidebar: w-48 flex-col border-r bg-gray-50 */}
  {/* Content area: flex-1 flex-col */}
  {/*   Scrollable body: flex-1 overflow-y-auto p-6 */}
  {/*   Footer: flex justify-end gap-3 border-t bg-white px-6 py-4 */}
</DialogContent>
```

**Form validation pattern:** Zod `.safeParse()` → iterate `.error.issues` → store in `Record<string, string>` state → render `<p className="text-sm text-red-500">{errors.field}</p>` inline. Apply `border-red-400 focus-visible:ring-red-400` on inputs with errors.

**Existing entry point in** `src/components/map.tsx`:

- `groupModalOpen` state drives `<GroupModal open={groupModalOpen} onOpenChange={...} />`
- `<GroupModal>` is imported from `'./group-modal'`
- The Users button in `ExpandableToolbar` calls `onPrimaryClick={() => setGroupModalOpen(true)}`

**No toast library is installed.** Build a custom portal toast component using `framer-motion`.

**No Group-related Prisma model or API route exists.** Build fully typed mock data interfaces that can be swapped for real API calls later.

---

## 2. FEATURE PRD

### 2.1 Feature Summary

Build the complete Groups UI system: an overview modal listing the user's groups, a create-group modal with full form validation, a full-page group view with tabbed navigation and member management, and supporting utilities (toast, delete confirmation modal, type definitions).

### 2.2 User Stories

- As a user on the map, I click the Users button to see my groups or an empty state CTA.
- As a user, I can create a group with a name, privacy, visibility, and invited emails.
- As a user, I can click a group to enter its full view page with tabs.
- As a group owner, I see a crown badge and can access admin options (Delete, Settings).
- As a regular member, administrative controls are hidden or disabled.
- As an owner attempting deletion, I must type the group name to confirm.
- I receive toast feedback on success/error after any group action.

---

## 3. ARCHITECTURE & FILE PLAN

### Files to CREATE

| Path                                         | Purpose                                                           |
| -------------------------------------------- | ----------------------------------------------------------------- |
| `src/lib/types/group.ts`                     | All group-related TypeScript interfaces + Zod schemas + mock data |
| `src/components/groups/GroupToast.tsx`       | Portal-based toast system (success + error variants)              |
| `src/components/groups/CreateGroupModal.tsx` | Multi-field group creation modal with validation                  |
| `src/components/groups/DeleteGroupModal.tsx` | Safety-barrier delete confirmation modal                          |
| `src/app/groups/[groupId]/page.tsx`          | Group view route page (layout + tabs)                             |

### Files to MODIFY

| Path                             | Change                                                                                                            |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `src/components/group-modal.tsx` | **Replace entirely** — becomes `GroupsOverviewModal` (the main groups list modal that opens from the map toolbar) |
| `src/components/map.tsx`         | No prop changes needed; the existing `<GroupModal>` import/usage stays, file internally changes                   |

---

## 4. WORKFLOW EXECUTION ORDER

Execute steps in this exact order to prevent circular dependencies:

1. **Create** `src/lib/types/group.ts`
2. **Create** `src/components/groups/GroupToast.tsx`
3. **Create** `src/components/groups/CreateGroupModal.tsx`
4. **Create** `src/components/groups/DeleteGroupModal.tsx`
5. **Rewrite** `src/components/group-modal.tsx` as `GroupsOverviewModal`
6. **Create** `src/app/groups/[groupId]/page.tsx`
7. **Verify** `src/components/map.tsx` — no changes needed if exports remain the same

---

## 5. DETAILED IMPLEMENTATION SPECS

---

### STEP 1 — `src/lib/types/group.ts`

Define ALL group-related types and mock data here. This is the single source of truth until a real backend is wired.

```typescript
// Group privacy / visibility enums
export type GroupPrivacy = 'PUBLIC' | 'PRIVATE';
export type GroupVisibility = 'VISIBLE' | 'HIDDEN';

// The role a user has within a group
export type GroupMemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

// A member within a group
export interface GroupMember {
  id: string;
  name: string;
  avatarUrl?: string | null;
  role: GroupMemberRole;
  joinedAt: string; // ISO date string
}

// Full group shape (returned from API / used throughout the UI)
export interface Group {
  id: string;
  name: string;
  description?: string | null;
  privacy: GroupPrivacy;
  visibility: GroupVisibility;
  coverPhotoUrl?: string | null;
  memberCount: number;
  postCount: number;
  ownerId: string;
  members: GroupMember[];
  createdAt: string; // ISO date string
}

// Payload sent to create a group
export interface CreateGroupPayload {
  name: string;
  description?: string;
  privacy: GroupPrivacy;
  visibility: GroupVisibility;
  inviteEmails: string[];
}

// ─── MOCK CURRENT USER ID ──────────────────────────────────────────
// Replace with actual auth user ID once backend is integrated
export const MOCK_CURRENT_USER_ID = 'user-001';

// ─── MOCK DATA ─────────────────────────────────────────────────────
// Replace with real API calls (TanStack Query hooks) in future sprints
export const MOCK_GROUPS: Group[] = [
  {
    id: 'group-001',
    name: 'BSCS Batch 2023',
    description:
      'Bachelor of Science in Computer Science — Batch 2023. A place for all BSCS 2023 alumni to reconnect and share memories.',
    privacy: 'PUBLIC',
    visibility: 'VISIBLE',
    coverPhotoUrl: null,
    memberCount: 42,
    postCount: 17,
    ownerId: 'user-001',
    createdAt: '2024-01-15T08:00:00.000Z',
    members: [
      {
        id: 'user-001',
        name: 'You (Owner)',
        avatarUrl: null,
        role: 'OWNER',
        joinedAt: '2024-01-15T08:00:00.000Z',
      },
      {
        id: 'user-002',
        name: 'Maria Santos',
        avatarUrl: null,
        role: 'ADMIN',
        joinedAt: '2024-01-16T09:00:00.000Z',
      },
      {
        id: 'user-003',
        name: 'Juan dela Cruz',
        avatarUrl: null,
        role: 'MEMBER',
        joinedAt: '2024-01-17T10:00:00.000Z',
      },
      {
        id: 'user-004',
        name: 'Ana Reyes',
        avatarUrl: null,
        role: 'MEMBER',
        joinedAt: '2024-01-18T11:00:00.000Z',
      },
      {
        id: 'user-005',
        name: 'Carlos Mendoza',
        avatarUrl: null,
        role: 'MEMBER',
        joinedAt: '2024-01-19T12:00:00.000Z',
      },
    ],
  },
  {
    id: 'group-002',
    name: 'BSIT Alumni 2022',
    description: 'IT Alumni group for the graduating batch of 2022.',
    privacy: 'PRIVATE',
    visibility: 'HIDDEN',
    coverPhotoUrl: null,
    memberCount: 28,
    postCount: 9,
    ownerId: 'user-002',
    createdAt: '2024-02-01T08:00:00.000Z',
    members: [
      {
        id: 'user-002',
        name: 'Maria Santos',
        avatarUrl: null,
        role: 'OWNER',
        joinedAt: '2024-02-01T08:00:00.000Z',
      },
      {
        id: 'user-001',
        name: 'You',
        avatarUrl: null,
        role: 'MEMBER',
        joinedAt: '2024-02-05T09:00:00.000Z',
      },
      {
        id: 'user-006',
        name: 'Pedro Ramos',
        avatarUrl: null,
        role: 'MEMBER',
        joinedAt: '2024-02-06T10:00:00.000Z',
      },
    ],
  },
];
```

Also add the Zod validation schema for group creation:

```typescript
import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Group name is required')
    .max(100, 'Group name must be 100 characters or less'),
  description: z
    .string()
    .trim()
    .max(500, 'Description must be 500 characters or less')
    .optional(),
  privacy: z.enum(['PUBLIC', 'PRIVATE']),
  visibility: z.enum(['VISIBLE', 'HIDDEN']),
  inviteEmails: z.string().trim(), // raw comma-separated string, validated loosely
});

export type CreateGroupFormData = z.infer<typeof createGroupSchema>;
```

---

### STEP 2 — `src/components/groups/GroupToast.tsx`

A self-contained, portal-rendered toast system using Framer Motion. Export:

- `GroupToast` component — renders a floating toast at bottom-center
- `useGroupToast` hook — exposes `showSuccess(message)` and `showError(message)`

**Spec:**

- Renders into a `div` portaled to `document.body` (use `createPortal` from `react-dom`)
- Toast floats at `fixed bottom-6 left-1/2 -translate-x-1/2 z-[200]`
- Maximum 1 toast visible at a time (queue is fine but not required)
- Success variant: `bg-white border border-green-200 text-gray-800` with a `CheckCircle2` icon in `text-green-500`
- Error variant: `bg-white border border-red-200 text-gray-800` with an `XCircle` icon in `text-red-500`
- Toast has a subtle rounded card shape: `rounded-xl px-4 py-3 shadow-xl flex items-center gap-3 min-w-[280px] max-w-sm`
- Auto-dismisses after 3000ms
- Animate in/out using Framer Motion: `initial={{ opacity: 0, y: 20 }}` → `animate={{ opacity: 1, y: 0 }}` → `exit={{ opacity: 0, y: 20 }}`
- Wrap the toast in `<AnimatePresence>` so exit animation plays
- The hook stores `{ id, message, type }` in state. Dismiss by setting state to `null` after timeout.

**Hook interface:**

```typescript
interface GroupToastHook {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  ToastPortal: React.FC; // render this at the root of the component that uses toast
}
```

---

### STEP 3 — `src/components/groups/CreateGroupModal.tsx`

A Dialog modal for creating a new group. Will be opened **from inside `GroupsOverviewModal`**.

**Props:**

```typescript
interface CreateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (group: Group) => void; // called after successful creation
}
```

**Layout:** Single-column centered dialog. No sidebar. Size: `max-w-lg w-full`. Use standard `DialogContent` pattern with `showCloseButton={false}`, `gap-0 overflow-hidden p-0`.

**Structure:**

```
Header area (px-6 pt-6 pb-4 border-b):
  - Title: "Create Group" (text-lg font-semibold text-gray-900)
  - Subtitle: "Set up a new group for your batch or community." (text-sm text-muted-foreground)

Scrollable form body (flex-1 overflow-y-auto px-6 py-5 space-y-5):
  1. Group Name field
  2. Description textarea (optional)
  3. Choose Privacy dropdown
  4. Choose Visibility dropdown
  5. Invite Users field

Footer (flex justify-end gap-3 border-t bg-white px-6 py-4):
  - Cancel button (variant="outline")
  - Create Group button (bg-skolaroid-blue, disabled when validation fails)
```

**Field 1 — Group Name:**

- `<Label>Group Name <span className="text-red-400">*</span></Label>`
- `<Input placeholder="e.g. BSCS Batch 2023" maxLength={100} />`
- Character counter: `<p className="text-xs text-muted-foreground text-right">{name.length}/100</p>`
- On error: red border + `<p className="text-sm text-red-500">{errors.name}</p>`
- Validate in real-time (onChange)

**Field 2 — Description (optional):**

- `<Label>Description <span className="text-xs text-muted-foreground">(optional)</span></Label>`
- `<textarea>` styled as: `w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none` — 3 rows, maxLength={500}
- Character counter: `<p className="text-xs text-muted-foreground text-right">{description.length}/500</p>`

**Field 3 — Choose Privacy (custom dropdown, NOT a native select):**
This is a custom-built dropdown panel that opens below the trigger button. It must NOT use shadcn `DropdownMenu` (that component lacks the rich option UI). Build it with local `useState` + `useRef` + click-outside handling.

Trigger button appearance:

```
Full-width, border rounded-md, flex items-center justify-between px-3 py-2 text-sm
Left side: privacy icon + selected label
Right side: ChevronDown icon
```

Dropdown panel (absolute, w-full, z-20, top-full, mt-1, border rounded-md bg-white shadow-lg):
Two options. Each option is a `<button>` with this layout:

```
px-4 py-3 w-full text-left flex gap-3 items-start hover:bg-gray-50
OptionIcon (Globe for Public, Lock for Private) 20px, text-skolaroid-blue, shrink-0 mt-0.5
Right column:
  - Option title (text-sm font-semibold text-gray-800)
  - Description text (text-xs text-gray-400 leading-relaxed mt-0.5):
    Public: "Anyone can see who's in the group and what they post. Depending on your group's size and age, you might be able to change to private later."
    Private: "Only members can see who's in the group and what they post. You might be able to change to public later."
Selected option: bg-skolaroid-blue/5 border-l-2 border-skolaroid-blue
```

Add an info tooltip (HoverCard or simple `group`/`absolute` pattern) next to the "Choose Privacy" label with an `Info` icon (size 14, text-gray-400). Tooltip content explains the difference in one sentence.

**Field 4 — Choose Visibility (same pattern as Privacy):**
Two options — Visible (Eye icon) and Hidden (EyeOff icon):

```
Visible: "Anyone can find this group."
Hidden: "Only members can find this group."
```

Add info tooltip next to "Choose Visibility" label.

**Field 5 — Invite Users:**

- Label: "Invite Members" with a small `(optional)` note
- `<div className="relative">` wrapping `<Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />` and `<Input className="pl-9" placeholder="Email, comma separated" />`

**Validation rules (Zod, real-time on blur + on submit attempt):**

- `name`: required, min 1, max 100
- `description`: optional, max 500
- `privacy`: required (enum)
- `visibility`: required (enum)
- `inviteEmails`: optional, no structural validation beyond string

**Create button disabled state:** Button is disabled AND visually muted (`opacity-50 cursor-not-allowed`) when: `name.trim() === ''` OR `errors.name !== undefined`. The button becomes active only when name is valid. Privacy and visibility have default values so they are never invalid.

**On submit:**

1. Run `.safeParse()` on form data
2. If invalid, set errors and return
3. If valid: build a new `Group` object from mock data (generate a UUID-like id with `crypto.randomUUID()`), call `onCreated(newGroup)`, close modal, reset form

**After success:** The `GroupsOverviewModal` (parent) will call `showSuccess("Group created successfully!")` on the toast.

**Reset:** On modal close (Cancel or after creation), reset all form fields and errors to initial state.

---

### STEP 4 — `src/components/groups/DeleteGroupModal.tsx`

A Dialog modal for confirming group deletion with a safety-barrier input.

**Props:**

```typescript
interface DeleteGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupName: string;
  onConfirmDelete: () => void;
}
```

**Layout:** Single-column, no sidebar. `max-w-md`. Standard `DialogContent` pattern.

**Structure:**

```
Header (px-6 pt-6 pb-0):
  - AlertTriangle icon (size 20, text-red-500) inline before title
  - Title: "Delete Group" (text-lg font-semibold text-gray-900)
  - Description: "This action cannot be undone. All posts, members, and data in this group will be permanently deleted."

Body (px-6 py-5 space-y-4):
  - <p className="text-sm text-gray-600">To confirm, type <strong className="font-semibold text-gray-900">{groupName}</strong> below:</p>
  - Input: placeholder="Type group name to confirm" value={confirmInput} onChange={...}
    - Apply red border/ring if user has typed something but it doesn't match: border-red-300 focus-visible:ring-red-300
    - Show helper text below: <p className="text-xs text-red-500">Name does not match.</p> — only visible when typed && doesn't match

Footer (flex justify-end gap-3 border-t bg-white px-6 py-4):
  - Cancel button (variant="outline", resets input and closes)
  - "Delete Group" button:
    - variant: `bg-red-600 hover:bg-red-700 text-white`
    - disabled when: confirmInput.trim() !== groupName
    - when disabled: opacity-50 cursor-not-allowed
    - when enabled and clicked: call onConfirmDelete()
```

**State:** Single `confirmInput` string. Reset to `''` on close.

---

### STEP 5 — Rewrite `src/components/group-modal.tsx` as `GroupsOverviewModal`

**Replace the entire file.** The component is still exported as `GroupModal` (named export) to avoid touching `map.tsx`.

```typescript
export function GroupModal({ open, onOpenChange }: GroupModalProps);
```

This is now the **User Groups Overview Modal** — it shows the user's list of groups or an empty state.

**Modal size:** `max-w-md w-full h-auto` (not fixed 500px — let it size naturally). Use `showCloseButton={false}`. No sidebar.

**State:**

```typescript
const [groups, setGroups] = useState<Group[]>(MOCK_GROUPS);
const [createModalOpen, setCreateModalOpen] = useState(false);
const [pasteInviteOpen, setPasteInviteOpen] = useState(false); // placeholder
```

Use `useGroupToast` hook. Include the `ToastPortal` component.

**Modal Header:**

```
px-6 pt-5 pb-4 border-b flex items-center justify-between
Left: "Your Groups" (text-lg font-semibold text-gray-900)
Right: X button (XIcon from lucide, size 18) → calls onOpenChange(false)
```

**Body — if `groups.length === 0` (Empty State):**

```
Centered column, py-12 px-6 text-center space-y-4:
  - Large icon: Users2 (size 48, text-gray-300, mx-auto)
  - Heading: "No groups yet" (text-base font-semibold text-gray-700)
  - Subtext: "Create your first group to start sharing memories with your batch or circle." (text-sm text-muted-foreground)
  - Button: "Create Your First Group" — full width, bg-skolaroid-blue, onClick={() => setCreateModalOpen(true)}
```

**Body — if `groups.length > 0` (Normal State):**

```
Layout:
  top bar (px-6 pt-4 pb-3 flex items-center gap-2):
    - "Create Group" button (small size, bg-skolaroid-blue text-white, Plus icon) → opens CreateGroupModal
    - "Paste Invite Link" button (small size, variant="outline", Link2 icon) → placeholder (console.log for now, mark as TODO for future integration)

  Scrollable group list (max-h-72 overflow-y-auto px-3 pb-3 space-y-1 scrollbar-hide):
    For each group, render a GroupListItem:
      <button
        onClick={() => { onOpenChange(false); router.push(`/groups/${group.id}`); }}
        className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 text-left transition-colors"
      >
        Avatar (rounded-full bg-skolaroid-blue/10 text-skolaroid-blue font-semibold w-10 h-10 flex items-center justify-center text-sm shrink-0)
          — show first letter of group name
        Right column:
          - Group name (text-sm font-semibold text-gray-900 truncate)
          - Meta line (text-xs text-muted-foreground):
            - PrivacyIcon (Globe or Lock, size 12, inline) + privacy label
            - dot separator "·"
            - memberCount + " members"
        Right edge: ChevronRight (size 16, text-gray-400 ml-auto shrink-0)
      </button>
```

**Footer (px-6 py-4 border-t):**
Only shown when groups exist. Cancel / close button (full width, variant="outline") → calls `onOpenChange(false)`.

**When `CreateGroupModal` closes with a new group:** `setGroups(prev => [newGroup, ...prev])`, then call `showSuccess("Group created successfully!")`.

**Use `useRouter` from `next/navigation`** to navigate on group click.

---

### STEP 6 — `src/app/groups/[groupId]/page.tsx`

This is a Next.js App Router page component. Mark it `'use client'` at the top.

**Route params:** `{ params: { groupId: string } }` — use `use(params)` (React 19) or destructure normally. Find the group in `MOCK_GROUPS.find(g => g.id === groupId)`. If not found, render a "Group not found" state with a back button.

**Current user:** Use `MOCK_CURRENT_USER_ID` from `group.ts` types. The viewer `isOwner` = `group.ownerId === MOCK_CURRENT_USER_ID`.

**Page layout (full height, flex):**

```
<div className="min-h-screen bg-gray-50 flex flex-col">
  {/* Page Header Bar */}
  {/* Cover Photo Section */}
  {/* Main Content Area (flex, sidebar + content) */}
</div>
```

**Page Header Bar:**

```
bg-white border-b px-6 py-3 flex items-center gap-3
- Back button: ChevronLeft icon + "Back to Groups" text → router.push('/map') [TODO: integrate with actual groups list route in future]
- Separator div (h-4 w-px bg-gray-200)
- Group name as breadcrumb (text-sm text-gray-500) → "Groups / {group.name}"
```

**Cover Photo Section:**

```
Relative div, h-48 bg-gradient-to-br from-skolaroid-blue/20 to-skolaroid-blue/5 overflow-hidden
- If coverPhotoUrl: render <Image src={coverPhotoUrl} fill alt="cover" className="object-cover" />
- If no cover: show a styled placeholder with a large background icon (ImageIcon from lucide, opacity-10)
- Edit cover button (positioned absolute bottom-3 right-3):
  <button className="flex items-center gap-1.5 rounded-md bg-white/90 border px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-white transition-colors backdrop-blur-sm" disabled>
    <Camera size={13} />
    Edit Cover
  </button>
  -- This button is intentionally non-interactive (disabled) — mark with a comment: // TODO: Implement cover photo upload in future sprint
```

**Group Info Bar (below cover):**

```
bg-white border-b px-6 py-4 flex items-start justify-between
Left:
  - Group name: text-xl font-bold text-gray-900
  - Meta row (flex items-center gap-3 mt-1):
    - Privacy icon (Globe or Lock size 14) + privacy label (text-sm text-muted-foreground)
    - dot separator
    - Visibility icon (Eye or EyeOff size 14) + visibility label (text-sm text-muted-foreground)
    - dot separator
    - memberCount + " members" (text-sm text-muted-foreground)
    - dot separator
    - postCount + " posts" (text-sm text-muted-foreground)

Right (flex items-center gap-2):
  - Invite button: <Button size="sm" className="bg-skolaroid-blue text-white hover:bg-skolaroid-blue/90 gap-1.5"><UserPlus size={14}/>Invite</Button>
    → onClick: placeholder toast "Invite feature coming soon" (showSuccess or console.log — mark as TODO)
  - Share button: <Button size="sm" variant="outline" className="gap-1.5"><Share2 size={14}/>Share</Button>
    → onClick: placeholder (TODO: implement share/copy link)
  - If isOwner: Delete button <Button size="sm" variant="outline" className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"><Trash2 size={14}/>Delete Group</Button>
    → onClick: setDeleteModalOpen(true)
```

**Tab Navigation:**

```
bg-white border-b px-6 flex gap-1
Tab type: 'discussion' | 'members' | 'events' | 'media' | 'files' | 'about'
Tab labels: { discussion: 'Discussion', members: 'Members', events: 'Events', media: 'Media', files: 'Files', about: 'About' }
Each tab:
<button
  onClick={() => setActiveTab(tab)}
  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
    activeTab === tab
      ? 'border-skolaroid-blue text-skolaroid-blue'
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
  }`}
>
  {tabLabel}
</button>
```

Default active tab: `'members'`.

**Main Content (flex, flex-1):**

```
flex flex-1 min-h-0
Left sidebar (w-56 border-r bg-white flex-col space-y-1 p-3 shrink-0 hidden lg:flex):
  Sidebar items (see below)
Content area (flex-1 overflow-y-auto p-6):
  Tab panel (see below)
```

**Left Sidebar Navigation Items:**
Each item:

```typescript
interface SidebarItem {
  icon: LucideIcon;
  label: string;
  adminOnly: boolean;
  onClick: () => void; // placeholder or real action
}
```

Items:

1. Home — `Home` icon — not admin-only — TODO placeholder: console.log or toast "Home tab coming soon"
2. Group Settings — `Settings` icon — **adminOnly: true** — only render if `isOwner || isAdmin` — TODO placeholder
3. Member Requests — `UserCheck` icon — adminOnly: true — placeholder
4. Pending Posts — `Clock` icon — adminOnly: true — placeholder
5. Activity Log — `Activity` icon — adminOnly: true — placeholder
6. Moderation — `Shield` icon — adminOnly: true — placeholder
7. Group Roles — `Tag` icon — adminOnly: true — placeholder

Render pattern:

```tsx
// Filter admin items if not owner/admin
const isAdmin =
  group.members.find((m) => m.id === MOCK_CURRENT_USER_ID)?.role === 'ADMIN';
const canSeeAdmin = isOwner || isAdmin;

sidebarItems
  .filter((item) => !item.adminOnly || canSeeAdmin)
  .map((item) => (
    <button
      key={item.label}
      onClick={item.onClick}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
    >
      <item.icon size={16} className="shrink-0 text-gray-500" />
      {item.label}
    </button>
  ));
```

Mark the admin-only items with a `// TODO: Implement admin-only guard via API role check` comment. Currently the guard is purely client-side mock logic; real integration should validate server-side.

**Tab Panel — Members Tab (default active tab):**
This is the only fully implemented tab.

```
Members tab content (space-y-4):
  Header row: "Members ({group.memberCount})" text-base font-semibold text-gray-900
  Member list (space-y-2):
    For each member in group.members:
      <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
        Avatar:
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={member.avatarUrl ?? ''} alt={member.name} />
            <AvatarFallback className="bg-skolaroid-blue/10 text-skolaroid-blue text-xs font-semibold">
              {member.name.slice(0,2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        Info column (flex-1 min-w-0):
          Name row (flex items-center gap-2):
            - member.name (text-sm font-semibold text-gray-900 truncate)
            - If role === 'OWNER':
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 shrink-0">
                <Crown size={10} />
                Owner
              </span>
            - If role === 'ADMIN':
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">Admin</Badge>
          Role subtitle:
            - text-xs text-muted-foreground: capitalize(role.toLowerCase()) + " · Joined " + formatDate(member.joinedAt)
        // Right side: placeholder for admin actions (kick, promote) — TODO: implement in future sprint
        // Keep a comment: {/* TODO: Member action menu (kick/promote) — admin only */}
      </div>
```

`formatDate` helper: format `joinedAt` as `"Jan 2024"` using `new Date(joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })`.

**Tab Panel — View Only notice for non-admin members on Settings:**
This is handled structurally: Group Settings is hidden in sidebar unless `canSeeAdmin`. No separate "read-only" panel needed since the feature isn't built yet. Leave a comment: `// TODO: Render view-only settings for members in future sprint`.

**Tab Panel — Discussion, Events, Media, Files (empty placeholder panels):**
Each of these renders a consistent empty placeholder:

```tsx
function TabPlaceholder({
  label,
  icon: Icon,
}: {
  label: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center justify-center space-y-3 py-16 text-center">
      <Icon size={40} className="text-gray-200" />
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="max-w-xs text-xs text-muted-foreground">
        This section is coming soon. Check back later.
      </p>
    </div>
  );
}
```

Use appropriate icons: MessageSquare for Discussion, CalendarDays for Events, Image for Media, FolderOpen for Files. Write these so the JSX structure is already in place and only needs real content dropped in later.

**Tab Panel — About:**
The About tab contains group metadata that in the prototype lived at the bottom of the members tab. Move it here:

```
About tab content (space-y-6 max-w-lg):
  Section: "About this group"
    - group.description (text-sm text-gray-700) or "No description provided." (text-sm text-muted-foreground italic) if empty

  Section: "Group details" (space-y-3)
    Each detail row (flex items-start gap-3):
      Icon (size 16, text-muted-foreground, mt-0.5, shrink-0)
      Content (text-sm text-gray-700)

    Rows:
    1. Globe/Lock icon → "{privacy === 'PUBLIC' ? 'Public' : 'Private'} group"
    2. Eye/EyeOff icon → "{visibility === 'VISIBLE' ? 'Visible' : 'Hidden'} to search"
    3. Users icon → "{memberCount} members"
    4. Calendar icon → "Created {new Date(group.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}"
    5. Crown icon (text-amber-500) → "Owned by {ownerMember?.name ?? 'Unknown'}"
```

**Delete Flow:**

- `deleteModalOpen` state (`boolean`)
- Render `<DeleteGroupModal open={deleteModalOpen} onOpenChange={setDeleteModalOpen} groupName={group.name} onConfirmDelete={handleDelete} />`
- `handleDelete`:
  1. `setDeleteModalOpen(false)`
  2. Runs mock deletion (filter from MOCK_GROUPS is local mock — just navigate)
  3. `showSuccess(\`"${group.name}" has been deleted.\`)`
  4. After 1000ms delay: `router.push('/map')` — comment: `// TODO: Navigate to /groups list page once that route is created`

**Toast integration:**
Use `useGroupToast` hook. Render `<ToastPortal />` within the component.

---

## 6. UI/UX SPECIFICATIONS

### Visual Consistency Rules

- Never use hardcoded hex colors. Use only `skolaroid-blue` and Tailwind semantic colors.
- All interactive elements must have `transition-colors` and appropriate hover states.
- Border radius: `rounded-md` for inputs/buttons, `rounded-lg` for cards/list items, `rounded-full` for avatars/pills.
- Spacing: follow `p-3` for tight items, `p-4`/`p-6` for content sections.
- Typography: `text-sm` is the baseline. `text-xs` for metadata. `text-base` or `text-lg font-semibold` for section headers.
- Shadows: `shadow-sm` for subtle lift, `shadow-lg` for modals/dropdowns.
- All scrollable areas must include `scrollbar-hide` class.
- Empty states must have a large icon (size 40-48), a heading, a subtext, and (if actionable) a CTA button.

### Privacy/Visibility Dropdown Icon Mapping

```
PUBLIC → <Globe size={16} />
PRIVATE → <Lock size={16} />
VISIBLE → <Eye size={16} />
HIDDEN → <EyeOff size={16} />
```

### Owner Badge

```
bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 text-[10px] font-semibold
inline-flex items-center gap-1
<Crown size={10} /> Owner
```

---

## 7. CONSTRAINTS

1. **Minimal Intervention:** Do NOT modify `map.tsx`, `expandable-toolbar.tsx`, `add-memory-modal.tsx`, `batches-modal.tsx`, or any file in `src/components/ui/`. The only components file you touch is `group-modal.tsx` (rewrite) and the new files you create.
2. **No new npm packages.** Use only what is already installed: `framer-motion`, `lucide-react`, `zod`, `next/navigation`, `react-dom` (createPortal), existing UI primitives.
3. **All new components** must be `'use client'` at the top.
4. **Named exports only** for all components and hooks. Default exports only for Next.js page files.
5. **No inline styles** except when a precise pixel value has no Tailwind equivalent.
6. **TypeScript strict.** No `any` types. All props must be fully typed with interfaces.
7. **Placeholder items** (future-integration points) must have a `// TODO:` comment describing exactly what needs to be connected, to make future sprint work unambiguous.
8. **The `GroupModal` named export** in `group-modal.tsx` must be preserved exactly so `map.tsx` requires zero changes.
9. **`src/lib/types/group.ts`** must export everything needed so no component imports mock data from each other — always import from this single file.
10. **All tab placeholder content** must be in a shared `TabPlaceholder` helper within the group view page file — not copy-pasted.

---

## 8. ACCEPTANCE CHECKLIST

Before finishing, verify each of these:

- [ ] Clicking Users button on map toolbar opens `GroupsOverviewModal` (no change to map.tsx needed)
- [ ] GroupsOverviewModal shows empty state when `groups.length === 0`
- [ ] GroupsOverviewModal shows group list with avatars, metadata, chevron when groups exist
- [ ] "Create Group" in overview opens `CreateGroupModal`
- [ ] Create button in `CreateGroupModal` is disabled until name is valid
- [ ] Privacy and visibility dropdowns show rich option descriptions with icons
- [ ] Info tooltips appear next to Privacy and Visibility labels
- [ ] Successful group creation: modal closes, new group prepended to list, success toast fires
- [ ] Clicking a group item navigates to `/groups/[groupId]`
- [ ] Group view page: cover photo area with non-interactive edit button
- [ ] Group view page: info bar with Invite, Share, and owner-only Delete button
- [ ] Group view page: 6-tab navigation (Discussion, Members, Events, Media, Files, About)
- [ ] Members tab: full member list with Crown+amber badge for owner, Admin badge for admins
- [ ] Left sidebar: 7 nav items, admin-only items gated by `canSeeAdmin`
- [ ] Non-member/non-admin cannot see Group Settings, Member Requests, etc. in sidebar
- [ ] About tab: group description, details (privacy, visibility, member count, created date, owner)
- [ ] Delete button only visible to owner (`isOwner === true`)
- [ ] `DeleteGroupModal`: Confirm button disabled until input matches group name exactly
- [ ] `DeleteGroupModal`: Shows "Name does not match" helper text on wrong input
- [ ] After deletion: success toast fires, then navigate to `/map` after 1000ms
- [ ] Toast: success uses green CheckCircle2, error uses red XCircle, auto-dismisses in 3s
- [ ] Toast animates in/out with Framer Motion
- [ ] Non-member tabs (Discussion, Events, Media, Files) show consistent empty placeholder
- [ ] TypeScript: zero `any` usages, all interfaces defined
- [ ] Zero modifications to `map.tsx` or any `src/components/ui/` files
