# GALLERY-1: Shareable Gallery Link — Opus Agent Directive

## Feature PRD

Implement a functional public shareable link for the gallery era view. When an authenticated user clicks **Copy Link** in the gallery header, the absolute URL of the public gallery page (scoped to the current era) is copied to their clipboard and a brief "Link copied!" toast appears inline. The generated link resolves to a public, unauthenticated page that fetches only `PUBLIC` + `APPROVED` memories for that era and is architected as a clean integration point for a teammate's viewable-format UI (which may be added later).

**Scope:**

- Functional clipboard copy with inline success feedback in `gallery/page.tsx`
- New public API route — no session required, only PUBLIC+APPROVED memories
- New public page `/share/gallery` — reads era from query param, loads via public hook, structured for teammate format-UI plug-in
- `NEXT_PUBLIC_APP_URL` env variable for cross-environment URL construction
- No Prisma schema migration required (use existing `id` UUID as the public identifier; era slug from existing `?era=` query pattern)

---

## System Context

| Layer                  | Detail                                                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------------------------- |
| Framework              | Next.js 15+ App Router, React 19, TypeScript 5                                                           |
| Styling                | Tailwind CSS + Radix UI shadcn primitives + hand-drawn design system                                     |
| State                  | TanStack React Query 5 — all server state via custom hooks                                               |
| DB                     | Prisma 7 + PostgreSQL (Supabase)                                                                         |
| Auth                   | Supabase SSR — server client in API routes via `createClient()` from `@/lib/supabase/server`             |
| Design tokens          | CSS vars in `globals.css`, wobbly radii from `@/lib/hand-drawn`, `cn()` from `@/lib/utils`               |
| Existing share pattern | `ShareGroupModal` uses `window.location.origin` — replace with `NEXT_PUBLIC_APP_URL` pattern here        |
| Key type               | `MemoryWithCoordinates` (extends `MemoryWithRelations`) from `@/lib/hooks/useAllMemoriesWithCoordinates` |
| Era logic              | `getEraFromBatchTag(memory.tags, memory.createdAt)` from `@/lib/utils`                                   |

**Critical design rules (from `sketch.prompt.md`):**

- Use shadcn primitives from `src/components/ui/` only — no raw markup for button/card/dialog
- Wobbly borders via `WOBBLY_RADIUS` / `WOBBLY_RADIUS_MD` from `@/lib/hand-drawn` applied as `style={{ borderRadius }}`
- Hard offset shadows only: `shadow-[4px_4px_0px_0px_#2d2d2d]`; hover lift: `shadow-[2px_2px_0px_0px_#2d2d2d] translate-x-[2px] translate-y-[2px]`; active press-flat: `shadow-none translate-x-[4px] translate-y-[4px]`
- Typography: `font-kalam` headings, `font-hand` body/UI, `font-dancing` brand-only
- No `active:scale-*`, no blur shadows, no `rounded-*` on non-circular elements
- Buttons use `Button` from `src/components/ui/button`

---

## Workflow Map

Execute strictly in this order to minimise re-reads and errors.

### Step 1 — Environment variable

Add to `.env` (and `.env.example` if it exists):

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

This variable must be `NEXT_PUBLIC_` so it is inlined at build time and available client-side.

---

### Step 2 — Public API route

**Create:** `src/app/api/public/memory/gallery/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getEraFromBatchTag } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const eraParam = searchParams.get('era');
  const era = eraParam ? parseInt(eraParam, 10) : null;

  try {
    const memories = await prisma.memory.findMany({
      where: {
        deletedAt: null,
        visibility: 'PUBLIC',
        moderationStatus: 'APPROVED',
      },
      include: {
        location: {
          select: {
            buildingName: true,
            latitude: true,
            longitude: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        tags: true,
        programBatch: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter by era client-side (same logic as authenticated gallery)
    const filtered =
      era !== null
        ? memories.filter(
            (m) =>
              getEraFromBatchTag(
                (m.tags ?? []) as { name: string }[],
                m.createdAt.toISOString()
              ) === era
          )
        : memories;

    return NextResponse.json({
      success: true,
      message: 'Public memories fetched successfully',
      data: filtered,
      era: era ?? null,
    });
  } catch (error) {
    console.error('[GET /api/public/memory/gallery]', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch memories' },
      { status: 500 }
    );
  }
}
```

**Why no auth check:** This is intentionally public. Only `PUBLIC` + `APPROVED` rows are returned — the visibility and moderation filters replace session-based access control.

---

### Step 3 — TanStack hook for public gallery

**Create:** `src/lib/hooks/usePublicGalleryMemories.ts`

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import type { MemoryWithCoordinates } from '@/lib/hooks/useAllMemoriesWithCoordinates';

interface PublicGalleryResponse {
  success: boolean;
  message: string;
  data: MemoryWithCoordinates[];
  era: number | null;
}

export function usePublicGalleryMemories(era: number | null) {
  return useQuery({
    queryKey: ['public-gallery', era],
    queryFn: async () => {
      const url =
        era !== null
          ? `/api/public/memory/gallery?era=${era}`
          : '/api/public/memory/gallery';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch public gallery');
      return res.json() as Promise<PublicGalleryResponse>;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
```

---

### Step 4 — Public gallery page

**Create:** `src/app/share/gallery/page.tsx`

This is the teammate integration surface. Keep it thin: load data, expose it clearly, leave a single clearly-commented slot for the viewable-format UI component.

```typescript
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePublicGalleryMemories } from '@/lib/hooks/usePublicGalleryMemories';
import type { MemoryWithCoordinates } from '@/lib/hooks/useAllMemoriesWithCoordinates';

// ─── TEAMMATE INTEGRATION POINT ──────────────────────────────────────────────
// Replace this placeholder with your viewable-format UI component.
// It receives `memories` (MemoryWithCoordinates[]) and `era` (number).
// Example: <ViewableFormatUI memories={memories} era={era} />
function PublicGalleryContent({
  memories,
  era,
}: {
  memories: MemoryWithCoordinates[];
  era: number;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <p className="font-dancing text-3xl italic text-primary">Skolaroid</p>
      <p className="font-kalam text-xl text-foreground">({era}s)</p>
      <p className="font-hand text-sm text-muted-foreground">
        {memories.length} public {memories.length === 1 ? 'memory' : 'memories'}
      </p>
      {/* ── PLUG IN VIEWABLE FORMAT UI HERE ── */}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

function ShareGalleryPageContent() {
  const searchParams = useSearchParams();
  const era = parseInt(searchParams.get('era') ?? '2020', 10);

  const { data: response, isLoading, error } = usePublicGalleryMemories(era);
  const memories = response?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="font-hand text-lg text-muted-foreground">
          Loading memories...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="font-hand text-lg text-destructive">
          Failed to load memories.
        </p>
      </div>
    );
  }

  return <PublicGalleryContent memories={memories} era={era} />;
}

export default function ShareGalleryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <p className="font-hand text-lg text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <ShareGalleryPageContent />
    </Suspense>
  );
}
```

---

### Step 5 — Update `gallery/page.tsx`

Two targeted changes only — do not touch scroll logic, clone logic, background rendering, or any other existing code.

#### 5a — Replace the `handleCopyLink` stub and add `copiedLink` state

At the top of `GalleryPageContent`, **after** the existing `useState` for `isDragging`, add:

```typescript
const [copiedLink, setCopiedLink] = useState(false);
```

Replace the module-level stub:

```typescript
// TODO: implement copy link functionality
const handleCopyLink = () => {};
```

With an instance method inside `GalleryPageContent`, right after the `copiedLink` state:

```typescript
const handleCopyLink = async () => {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    (typeof window !== 'undefined' ? window.location.origin : '');
  const url = `${base}/share/gallery?era=${activeEra}`;
  try {
    await navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  } catch {
    // clipboard unavailable — silently ignore
  }
};
```

#### 5b — Update the Copy Link button and add inline toast

Replace the existing button element:

```tsx
<button
  onClick={handleCopyLink}
  aria-label="Copy Link"
  className="ml-auto flex aspect-square items-center justify-center gap-2 border-2 border-black bg-white p-1.5 font-hand text-sm sm:aspect-auto sm:px-4 sm:py-1.5"
>
  <span className="hidden sm:inline">Copy Link</span>
  <Link2 className="h-4 w-4" />
</button>
```

With this (adds relative wrapper for toast positioning + press-flat interaction + copied state):

```tsx
<div className="relative ml-auto">
  <button
    onClick={handleCopyLink}
    aria-label="Copy shareable link"
    className={cn(
      'flex aspect-square items-center justify-center gap-2 border-2 border-black bg-white p-1.5 font-hand text-sm transition-[box-shadow,transform] duration-75 sm:aspect-auto sm:px-4 sm:py-1.5',
      'shadow-[4px_4px_0px_0px_#2d2d2d]',
      'hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#2d2d2d]',
      'active:translate-x-[4px] active:translate-y-[4px] active:shadow-none'
    )}
  >
    <span className="hidden sm:inline">
      {copiedLink ? 'Copied!' : 'Copy Link'}
    </span>
    <Link2 className="h-4 w-4" />
  </button>

  {/* Inline toast */}
  {copiedLink && (
    <span
      aria-live="polite"
      className="absolute -bottom-8 right-0 whitespace-nowrap rounded border-2 border-black bg-white px-2 py-0.5 font-hand text-xs shadow-[2px_2px_0px_0px_#2d2d2d]"
    >
      Link copied!
    </span>
  )}
</div>
```

Add `cn` to the import list at the top of `gallery/page.tsx` if not already imported:

```typescript
import { cn } from '@/lib/utils';
```

---

### Step 6 — Verify teammate's viewable-format UI (scan before finalising)

Before finalising Step 4, scan for any existing component matching these patterns:

- Files matching `**/share/**`, `**/public/**`, `**/viewable**`, `**/format**` in `src/`
- Components named `ViewableFormat*`, `PublicGallery*`, `FormatSelector*`, `GalleryFormat*`

If found: import it into `PublicGalleryContent` and pass `memories` + `era` as props instead of rendering the placeholder div. Remove the placeholder comment and replace with the actual component. Do not alter the teammate's component.

If not found: leave the `PublicGalleryContent` placeholder exactly as written above with the integration comment intact.

---

## UI/UX Specs

### Copy Link Button (gallery header)

- **Position:** `ml-auto` in the existing header flex row — already in place, do not move
- **Resting state:** `border-2 border-black bg-white`, hard shadow `shadow-[4px_4px_0px_0px_#2d2d2d]`, label "Copy Link" + `<Link2>` icon
- **Hover:** lift shadow `shadow-[2px_2px_0px_0px_#2d2d2d]` + `translate-x-[2px] translate-y-[2px]`
- **Active (press):** `shadow-none translate-x-[4px] translate-y-[4px]` — press-flat, no `scale-*`
- **Copied state:** label changes to "Copied!" for 2 s; icon stays
- **Toast:** small tag below the button, `border-2 border-black bg-white`, `font-hand text-xs`, `shadow-[2px_2px_0px_0px_#2d2d2d]`, `aria-live="polite"`, disappears after 2 s
- **Mobile:** button is square (`aspect-square`), label hidden, only icon shown — already handled by existing responsive classes

### Public share page (`/share/gallery`)

- Minimal — loading/error states use `font-hand` body text in `text-muted-foreground` / `text-destructive`
- Header: `font-dancing` brand + `font-kalam` era label, same as gallery header
- No polaroid rendering in the placeholder — teammate owns the display layer
- Background: inherits root body paper texture from `globals.css`

---

## Files Summary

| Action     | Path                                            |
| ---------- | ----------------------------------------------- |
| **Create** | `src/app/api/public/memory/gallery/route.ts`    |
| **Create** | `src/lib/hooks/usePublicGalleryMemories.ts`     |
| **Create** | `src/app/share/gallery/page.tsx`                |
| **Modify** | `src/app/gallery/page.tsx` (Steps 5a + 5b only) |
| **Modify** | `.env` (add `NEXT_PUBLIC_APP_URL`)              |

---

## Commit Message

```
feat(gallery): add public shareable link with clipboard copy and public gallery route
```

---

## PR Description

Add a functional shareable link to the gallery era view, including a public API route, a TanStack hook, a public page, and clipboard copy with inline feedback in the gallery header.

**Changes:**

1. Add NEXT_PUBLIC_APP_URL env variable used to construct absolute share URLs in a cross-environment-safe way
2. Create GET /api/public/memory/gallery with no session requirement — returns only PUBLIC and APPROVED memories, optionally filtered by era query param using the same getEraFromBatchTag logic as the authenticated gallery
3. Create usePublicGalleryMemories hook that hits the new public API, keyed by era, with the same staleTime and retry config as other gallery hooks
4. Create /share/gallery page as a Suspense-wrapped client component that reads era from search params and renders a clearly commented integration slot for the teammate's viewable-format UI component — memories and era are passed as props to make the plug-in seamless
5. Implement handleCopyLink in gallery/page.tsx replacing the existing empty stub — constructs the share URL from NEXT_PUBLIC_APP_URL with current era, writes to clipboard, sets a 2-second copiedLink state
6. Update the Copy Link button to apply press-flat interaction (hard shadow, hover lift, active translate, no scale) per the hand-drawn design system, swap label to "Copied!" during active state
7. Add an aria-live inline toast that appears below the Copy Link button for 2 seconds on successful copy, styled with border-2, bg-white, hard offset shadow, and font-hand — no external toast library used

**File Locations:**

- `src/app/api/public/memory/gallery/route.ts`
- `src/lib/hooks/usePublicGalleryMemories.ts`
- `src/app/share/gallery/page.tsx`
- `src/app/gallery/page.tsx`
- `.env`
