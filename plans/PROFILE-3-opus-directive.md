# OPUS MASTER DIRECTIVE — PROFILE-3: Profile Edit UI + Hook

> **You are operating in Agent Mode. Execute every step automatically. Do not ask the user to create files. Do not skip steps. Do not leave TODOs unless explicitly marked as future integration points.**

---

## 1. SYSTEM CONTEXT

**Stack:** Next.js 15 App Router · TypeScript 5 · Tailwind CSS v3 · shadcn/ui (new-york) · Radix UI primitives · Lucide React · Zod v4 · TanStack Query v5 · Supabase auth · Prisma ORM (PostgreSQL)

**Design System (`sketch.prompt.md`):**

- UI primitives: `Button`, `Input`, `Dialog`, `Label`, `Card`, `CardHeader`, `CardTitle`, `CardContent` from `src/components/ui/`
- `cn()` from `@/lib/utils`
- `WOBBLY_RADIUS` / `WOBBLY_RADIUS_MD` from `@/lib/hand-drawn` — apply via `style={{ borderRadius: WOBBLY_RADIUS }}`
- `rounded-full` only for true circles (avatars). All other containers use wobbly inline style.
- **Shadows:** hard offset only — `shadow-[4px_4px_0px_0px_#2d2d2d]`. No blur.
- **Colors:** `--background: #fdfbf7`, `--foreground: #2d2d2d`, `--card: #ffffff`, `--primary: #3F83DB`, `--muted: #e5e0d8`, `--border: #2d2d2d`
- **Fonts:** `font-kalam` headings, `font-hand` all UI text/inputs/buttons
- **Button active:** `active:shadow-none active:translate-x-[4px] active:translate-y-[4px]` (press-flat). No `active:scale-*`.
- **Dialog:** warm paper overlay (no blur), `WOBBLY_RADIUS_MD` content panel, `border-2 border-border`, `shadow-[6px_6px_0px_0px_#2d2d2d]`
- **`DialogContent` has `showCloseButton?: boolean` prop** — always pass `showCloseButton={false}` and use your own cancel/close buttons.

**`DialogContent` layout pattern (copy exactly):**

```tsx
<DialogContent
  className="flex max-h-[90vh] max-w-lg flex-col gap-0 overflow-hidden p-0"
  showCloseButton={false}
>
  <DialogTitle className="sr-only">Edit Profile</DialogTitle>
  {/* Scrollable body */}
  <div className="flex-1 space-y-6 overflow-y-auto p-6">…</div>
  {/* Pinned footer */}
  <div className="flex justify-end gap-3 border-t-2 border-border bg-card px-6 py-4">
    …
  </div>
</DialogContent>
```

**Form validation pattern:** Zod `.safeParse()` → iterate `.error.issues` → `Record<string, string>` state → `<p className="mt-1 text-xs text-destructive font-hand">{errors.field}</p>` inline below each input. Apply `border-destructive focus-visible:ring-destructive/20` on errored inputs.

**`useCurrentUser` hook** (`src/lib/hooks/useCurrentUser.ts`) returns `{ data: { success, data: CurrentUserProfile | null }, isLoading }` via TanStack Query with key `['currentUser']`.

**Existing `ProfileHero`** (`src/components/profile/ProfileHero.tsx`): receives `user: User | null` (Supabase) and `dbUser: CurrentUserProfile | null`. Has a disabled `<Button variant="outline" size="sm">Edit Profile</Button>` — this must be wired.

**No avatar upload backend exists yet.** Avatar preview is local (`URL.createObjectURL`) only. The `avatarUrl` field in the PATCH body is `null` unless a future storage endpoint populates it. Mark this with a `// TODO: wire Supabase storage upload` comment.

---

## 2. FEATURE PRD

**Goal:** Enable users to edit their bio, contact info, and avatar from the profile page via a modal.

**Editable fields:**

- `bio` — free-text, max 500 chars
- `phone` — optional, max 50 chars
- `linkedinUrl` — optional URL, max 255 chars
- `facebookUrl` — optional URL, max 255 chars
- `contactOther` — optional, max 255 chars
- `avatarUrl` — placeholder only (local preview; stored value remains `null` until storage is wired)

**Non-editable in this sprint:** `firstName`, `lastName`, `email`, `studentId`, `programBatch`, `status`, `role` — show these as read-only display text inside the modal if needed for context, but do not render them as inputs.

**Behavior:**

1. User clicks "Edit Profile" in `ProfileHero` → `EditProfileModal` opens pre-populated with current values.
2. User edits fields → client-side Zod validation on submit.
3. On submit, `useUpdateProfile` mutation fires `PATCH /api/prisma/user/update`.
4. On success: `queryClient.invalidateQueries({ queryKey: ['currentUser'] })` → modal closes → `ProfileBioCard` and `ProfileContactCard` re-render with fresh data.
5. On error: display inline error message in the modal footer area.

---

## 3. ARCHITECTURE & FILE PLAN

### Files to CREATE

| Path                                          | Purpose                                                   |
| --------------------------------------------- | --------------------------------------------------------- |
| `src/app/api/prisma/user/update/route.ts`     | `PATCH` — updates editable profile fields on the User row |
| `src/lib/hooks/useUpdateProfile.ts`           | TanStack `useMutation` hook wrapping the PATCH endpoint   |
| `src/components/profile/EditProfileModal.tsx` | The edit profile dialog component                         |

### Files to MODIFY

| Path                                            | Change                                                                                          |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `prisma/schema.prisma`                          | Add 6 nullable fields to `User` model                                                           |
| `src/lib/schemas.ts`                            | Add `updateProfileSchema` + `UpdateProfileInput` type                                           |
| `src/lib/hooks/useCurrentUser.ts`               | Extend `CurrentUserProfile` with the 6 new optional nullable fields                             |
| `src/components/profile/ProfileHero.tsx`        | Accept `onEditClick: () => void` prop; enable the Edit Profile button                           |
| `src/components/profile/ProfileBioCard.tsx`     | Accept `bio?: string \| null` prop; render bio or placeholder                                   |
| `src/components/profile/ProfileContactCard.tsx` | Accept `phone`, `linkedinUrl`, `facebookUrl`, `contactOther` props; render real values          |
| `src/app/profile/page.tsx`                      | Add `editOpen` state; pass `onEditClick` to `ProfileHero`; pass data props to bio/contact cards |

---

## 4. WORKFLOW EXECUTION ORDER

Execute in this exact order to avoid type errors from missing dependencies:

1. **Modify** `prisma/schema.prisma` — add fields to `User`
2. **Run** `pnpm prisma migrate dev --name add_profile_fields` in the terminal
3. **Modify** `src/lib/schemas.ts` — add `updateProfileSchema`
4. **Modify** `src/lib/hooks/useCurrentUser.ts` — extend `CurrentUserProfile`
5. **Create** `src/app/api/prisma/user/update/route.ts`
6. **Create** `src/lib/hooks/useUpdateProfile.ts`
7. **Create** `src/components/profile/EditProfileModal.tsx`
8. **Modify** `src/components/profile/ProfileHero.tsx`
9. **Modify** `src/components/profile/ProfileBioCard.tsx`
10. **Modify** `src/components/profile/ProfileContactCard.tsx`
11. **Modify** `src/app/profile/page.tsx`

---

## 5. DETAILED IMPLEMENTATION SPECS

---

### STEP 1 — `prisma/schema.prisma`

Inside the `User` model, add these 6 nullable fields (place them after `updatedAt`):

```prisma
bio             String?         @db.VarChar(500)
phone           String?         @db.VarChar(50)
linkedinUrl     String?         @db.VarChar(255)
facebookUrl     String?         @db.VarChar(255)
contactOther    String?         @db.VarChar(255)
avatarUrl       String?         @db.VarChar(500)
```

---

### STEP 2 — Run Migration

```bash
pnpm prisma migrate dev --name add_profile_fields
```

---

### STEP 3 — `src/lib/schemas.ts`

Append after the `onboardUserSchema` block (before the `// SHARED TYPES` section):

```typescript
// ============================================================================
// PROFILE UPDATE SCHEMA
// ============================================================================

export const updateProfileSchema = z.object({
  bio: z
    .string()
    .trim()
    .max(500, 'Bio must be 500 characters or less')
    .optional(),
  phone: z
    .string()
    .trim()
    .max(50, 'Phone must be 50 characters or less')
    .optional(),
  linkedinUrl: z
    .string()
    .trim()
    .max(255)
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),
  facebookUrl: z
    .string()
    .trim()
    .max(255)
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),
  contactOther: z.string().trim().max(255).optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
```

---

### STEP 4 — `src/lib/hooks/useCurrentUser.ts`

Extend `CurrentUserProfile` with the new fields. Add after the `role` line:

```typescript
  bio?: string | null;
  phone?: string | null;
  linkedinUrl?: string | null;
  facebookUrl?: string | null;
  contactOther?: string | null;
  avatarUrl?: string | null;
```

Also update the Prisma `findUnique` select in `get-current/route.ts` — but since it uses `include` without explicit `select`, all new scalar fields are returned automatically. No route change needed.

---

### STEP 5 — `src/app/api/prisma/user/update/route.ts`

```typescript
import { prisma } from '@/lib/prisma';
import { updateProfileSchema } from '@/lib/schemas';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * PATCH /api/prisma/user/update
 *
 * Updates editable profile fields (bio, phone, social links, avatarUrl).
 * Identity fields (name, email, studentId, programBatch) are immutable here.
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Strip empty strings → null so the DB stores clean nulls
    const data = Object.fromEntries(
      Object.entries(parsed.data).map(([k, v]) => [k, v === '' ? null : v])
    );

    const updated = await prisma.user.update({
      where: { id: authUser.id },
      data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
```

---

### STEP 6 — `src/lib/hooks/useUpdateProfile.ts`

```typescript
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateProfileInput } from '@/lib/schemas';

interface UpdateProfileResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProfileInput) => {
      const res = await fetch('/api/prisma/user/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const body = (await res.json()) as UpdateProfileResponse;
      if (!res.ok)
        throw new Error(
          body.error ?? body.message ?? 'Failed to update profile'
        );
      return body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}
```

---

### STEP 7 — `src/components/profile/EditProfileModal.tsx`

Build this component following the **Dialog layout pattern** from System Context exactly.

**Full spec:**

```typescript
'use client';
```

**Imports needed:** `useState`, `useRef`, `useEffect` from `react`; `Image` from `next/image`; `User as UserIcon`, `Camera`, `X` from `lucide-react`; `Dialog`, `DialogContent`, `DialogTitle` from `@/components/ui/dialog`; `Button` from `@/components/ui/button`; `Input` from `@/components/ui/input`; `Label` from `@/components/ui/label`; `cn` from `@/lib/utils`; `WOBBLY_RADIUS` from `@/lib/hand-drawn`; `useUpdateProfile` from `@/lib/hooks/useUpdateProfile`; `updateProfileSchema` from `@/lib/schemas`; `type CurrentUserProfile` from `@/lib/hooks/useCurrentUser`; `type User` from `@supabase/supabase-js`

**Props interface:**

```typescript
interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dbUser: CurrentUserProfile | null;
  authUser: User | null;
}
```

**Internal state:**

```typescript
const [bio, setBio] = useState('');
const [phone, setPhone] = useState('');
const [linkedinUrl, setLinkedinUrl] = useState('');
const [facebookUrl, setFacebookUrl] = useState('');
const [contactOther, setContactOther] = useState('');
const [avatarPreview, setAvatarPreview] = useState<string | null>(null); // local preview only
const [errors, setErrors] = useState<Record<string, string>>({});
const [submitError, setSubmitError] = useState<string | null>(null);
const fileInputRef = useRef<HTMLInputElement>(null);
const { mutate: updateProfile, isPending } = useUpdateProfile();
```

**`useEffect`:** When `open` becomes `true`, populate all state fields from `dbUser` (use `?? ''` for strings, `?? null` for avatarPreview). Reset `errors` and `submitError`.

**Avatar section layout:**

- Centered column: current avatar (96×96 `rounded-full`, `object-cover`, hard shadow `shadow-[3px_3px_0px_0px_rgba(45,45,45,0.3)]`) or fallback `<UserIcon className="h-10 w-10" />` in same sized circle
- Below avatar: a small `<Button variant="outline" size="sm">` with `<Camera className="h-3.5 w-3.5" />` + "Change Photo" text, that triggers a hidden `<input type="file" accept="image/*" ref={fileInputRef} />`
- On file select: `URL.createObjectURL(file)` → `setAvatarPreview`
- Below "Change Photo": `<p className="text-xs text-muted-foreground font-hand">Photo upload coming soon</p>` — this is the placeholder notice
- **`// TODO: wire Supabase storage upload`** comment on the file change handler

**Form sections (two sections, separated by a subtle `<hr className="border-dashed border-muted-foreground/30" />`):**

**Section 1 — "About Me"**

- `<h3 className="text-sm font-kalam font-bold text-foreground">About Me</h3>`
- `<Label>` + `<textarea>` for bio — textarea must use same styling as `Input` (`border-2 border-border bg-transparent px-3 py-2 font-hand text-base transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 resize-none h-24 w-full`), `style={{ borderRadius: WOBBLY_RADIUS }}`, maxLength 500
- Character counter: `<p className="text-right text-xs text-muted-foreground font-hand">{bio.length}/500</p>`

**Section 2 — "Contact Info"**

- `<h3 className="text-sm font-kalam font-bold text-foreground">Contact Info</h3>`
- Four `<FormInput>`-equivalent blocks (use raw `Label` + `Input` — do not import `FormInput` to avoid extra deps, keep it inline):
  - Phone (`type="tel"`, placeholder `+63 XXX XXX XXXX`)
  - LinkedIn (`type="url"`, placeholder `https://linkedin.com/in/…`)
  - Facebook (`type="url"`, placeholder `https://facebook.com/…`)
  - Other (`type="text"`, placeholder `Discord, Twitter, etc.`)
- Render error paragraph below each errored input.

**Footer (pinned):**

- Left side: `{submitError && <p className="text-xs text-destructive font-hand">{submitError}</p>}`
- Right side: Cancel button (`variant="outline" size="sm"`, disabled when `isPending`) + Save button (`variant="default" size="sm"`, shows `"Saving…"` when `isPending`)
- Footer layout: `flex items-center justify-between gap-3`

**Submit handler:**

```typescript
const handleSubmit = () => {
  setErrors({});
  setSubmitError(null);

  const parsed = updateProfileSchema.safeParse({
    bio: bio || undefined,
    phone: phone || undefined,
    linkedinUrl: linkedinUrl || undefined,
    facebookUrl: facebookUrl || undefined,
    contactOther: contactOther || undefined,
    avatarUrl: null, // TODO: replace with uploaded URL when storage is wired
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as string;
      fieldErrors[key] = issue.message;
    }
    setErrors(fieldErrors);
    return;
  }

  updateProfile(parsed.data, {
    onSuccess: () => onOpenChange(false),
    onError: (err) =>
      setSubmitError(
        err instanceof Error ? err.message : 'Something went wrong'
      ),
  });
};
```

---

### STEP 8 — `src/components/profile/ProfileHero.tsx`

**Change 1:** Add `onEditClick: () => void` to `ProfileHeroProps`.

**Change 2:** Replace the disabled `<Button>` block with:

```tsx
<Button variant="outline" size="sm" onClick={onEditClick}>
  Edit Profile
</Button>
```

Remove the `disabled` and `cursor-not-allowed opacity-50` attributes entirely.

**No other changes.** Do not touch styling, layout, or avatar rendering.

---

### STEP 9 — `src/components/profile/ProfileBioCard.tsx`

**Change:** Add `bio?: string | null` to props. Replace the static placeholder content with:

```tsx
interface ProfileBioCardProps {
  bio?: string | null;
}

export function ProfileBioCard({ bio }: ProfileBioCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">About Me</CardTitle>
      </CardHeader>
      <CardContent>
        {bio ? (
          <p className="whitespace-pre-wrap font-hand text-sm leading-relaxed text-foreground/80">
            {bio}
          </p>
        ) : (
          <div className="rounded-md border border-dashed bg-muted/40 px-4 py-6 text-center">
            <p className="text-sm italic text-muted-foreground">
              No bio added yet.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

### STEP 10 — `src/components/profile/ProfileContactCard.tsx`

**Change:** Accept contact data props and render real values. Replace the entire file:

```typescript
'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface ProfileContactCardProps {
  phone?: string | null;
  linkedinUrl?: string | null;
  facebookUrl?: string | null;
  contactOther?: string | null;
}

interface ContactRow {
  label: string;
  value?: string | null;
  href?: string;
}

export function ProfileContactCard({
  phone,
  linkedinUrl,
  facebookUrl,
  contactOther,
}: ProfileContactCardProps) {
  const contactRows: ContactRow[] = [
    { label: 'Phone', value: phone },
    { label: 'LinkedIn', value: linkedinUrl, href: linkedinUrl ?? undefined },
    { label: 'Facebook', value: facebookUrl, href: facebookUrl ?? undefined },
    { label: 'Other', value: contactOther },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Contact Information</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {contactRows.map(({ label, value, href }) => (
            <li key={label} className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-foreground/70">{label}</span>
              {value ? (
                href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary underline-offset-2 hover:underline font-hand truncate max-w-[60%]"
                  >
                    {value}
                  </a>
                ) : (
                  <span className="text-sm font-hand text-foreground/80">{value}</span>
                )
              ) : (
                <span className="text-sm text-muted-foreground">Not provided</span>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
```

---

### STEP 11 — `src/app/profile/page.tsx`

**Changes:**

1. Import `useState` from `'react'`.
2. Import `EditProfileModal` from `'@/components/profile/EditProfileModal'`.
3. Add state: `const [editOpen, setEditOpen] = useState(false);`
4. Pass `onEditClick={() => setEditOpen(true)}` to `<ProfileHero>`.
5. Pass `bio={dbUser?.bio}` to `<ProfileBioCard>`.
6. Pass `phone={dbUser?.phone}`, `linkedinUrl={dbUser?.linkedinUrl}`, `facebookUrl={dbUser?.facebookUrl}`, `contactOther={dbUser?.contactOther}` to `<ProfileContactCard>`.
7. Render `<EditProfileModal>` after the grid, passing `open={editOpen}`, `onOpenChange={setEditOpen}`, `dbUser={dbUser}`, `authUser={user}`.

The final JSX structure for the return:

```tsx
return (
  <>
    <div className="flex w-full flex-1 flex-col gap-6">
      <ProfileHero
        user={user}
        dbUser={dbUser}
        onEditClick={() => setEditOpen(true)}
      />
      <div className="grid gap-6 md:grid-cols-2">
        <ProfileBioCard bio={dbUser?.bio} />
        <ProfileContactCard
          phone={dbUser?.phone}
          linkedinUrl={dbUser?.linkedinUrl}
          facebookUrl={dbUser?.facebookUrl}
          contactOther={dbUser?.contactOther}
        />
        <ProfileAcademicCard
          studentId={dbUser?.studentId}
          program={dbUser?.programBatch.program.name}
          batch={dbUser?.programBatch.batch.year}
          status={dbUser?.status}
        />
        <ProfileActivityCard />
        <ProfileMemoriesCard userId={dbUser?.id} />
        <ProfileSettingsCard />
      </div>
    </div>
    <EditProfileModal
      open={editOpen}
      onOpenChange={setEditOpen}
      dbUser={dbUser}
      authUser={user}
    />
  </>
);
```

---

## 6. QUALITY GATES

Before finishing, verify:

- [ ] `pnpm tsc --noEmit` passes with zero errors
- [ ] The "Edit Profile" button in `ProfileHero` is no longer disabled
- [ ] `EditProfileModal` opens, pre-populates fields from `dbUser`, validates on submit, POSTs to `/api/prisma/user/update`, closes on success
- [ ] `ProfileBioCard` renders bio text when present, placeholder when null
- [ ] `ProfileContactCard` renders links for URL fields, plain text for phone/other
- [ ] No new `eslint` warnings introduced in modified files

---

## 7. COMMIT MESSAGE

```
feat(profile): add edit profile modal with bio and contact fields
```

---

## 8. PR DESCRIPTION

**feat(profile): Edit profile modal with bio, contact info, and avatar placeholder**

1. Added `bio`, `phone`, `linkedinUrl`, `facebookUrl`, `contactOther`, and `avatarUrl` nullable fields to the `User` Prisma model with a new migration.
2. Added `updateProfileSchema` Zod schema and `UpdateProfileInput` type to the shared schemas file.
3. Extended `CurrentUserProfile` interface with the 6 new optional nullable fields.
4. Created `PATCH /api/prisma/user/update` route — validates via Zod, strips empty strings to `null`, updates the authenticated user's row.
5. Created `useUpdateProfile` TanStack mutation hook — POATCHes the update endpoint and invalidates the `['currentUser']` query cache on success.
6. Built `EditProfileModal` — pre-populated from `dbUser` on open, client-side Zod validation on submit, inline field errors, pinned footer with loading state.
7. Avatar section in modal shows local `URL.createObjectURL` preview on file select; `avatarUrl` is stored as `null` pending storage integration (marked with `// TODO`).
8. Wired the previously disabled "Edit Profile" button in `ProfileHero` to open the modal.
9. `ProfileBioCard` now renders actual bio text or the existing dashed placeholder when empty.
10. `ProfileContactCard` now renders real values from `dbUser`; URL fields render as `<a target="_blank">` links.

**File Locations**

- 4 → `src/app/api/prisma/user/update/route.ts`
- 5 → `src/lib/hooks/useUpdateProfile.ts`
- 6, 7 → `src/components/profile/EditProfileModal.tsx`
- 8 → `src/components/profile/ProfileHero.tsx`
- 9 → `src/components/profile/ProfileBioCard.tsx`
- 10 → `src/components/profile/ProfileContactCard.tsx`
- 1 → `prisma/schema.prisma` + new migration folder
- 2 → `src/lib/schemas.ts`
- 3 → `src/lib/hooks/useCurrentUser.ts`
