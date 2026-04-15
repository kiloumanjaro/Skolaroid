# Page Flip Animation Guide

This guide reflects the current book-style memory modal implementation in [MemoryDetailModal.tsx](/c:/Users/Administrator/Documents/Coding/Projects/Skolaroid/src/components/map/MemoryDetailModal.tsx) and [memory-modal-animations.ts](/c:/Users/Administrator/Documents/Coding/Projects/Skolaroid/src/components/map/memory-modal-animations.ts).

## Overview

The modal uses three separate animation layers:

- A background overlay fade
- A two-cover book open/close animation
- A mirrored page-flip system for next/previous navigation

The important implementation detail is that navigation happens immediately, and the animation is preserved by caching the outgoing content in overlay layers while the base pages render the incoming memory underneath.

## Key Files

### `src/components/map/memory-modal-animations.ts`

Defines the shared timing and Framer Motion variants:

```ts
export const BOOK_OPEN_DURATION = 0.8;
export const BOOK_CLOSE_DURATION = 1.8;
export const PAGE_FLIP_DURATION = 0.6;
```

It also contains:

- `coverLeftVariants`
- `coverRightVariants`
- `rightPageFlipVariants`
- `leftPageFlipVariants`
- `chevronVariants`
- `overlayVariants`

Current easing is cubic-bezier based:

- `easeInOutCubic` for the covers
- `easeInCubic` for the page flips

Both page-flip variant objects also expose a `hidden` state, but the modal currently animates between `flat` and `flipped`.

### `src/components/map/MemoryDetailModal.tsx`

Owns the animation state, content caching, mirrored base-page logic, and overlay rendering.

## Animation State

The current implementation uses these core state values:

```ts
type AnimationPhase = 'closed' | 'opening' | 'open' | 'closing';
type FlipDirection = 'next' | 'prev' | null;

const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('closed');
const [isRightPageFlipped, setIsRightPageFlipped] = useState(false);
const [isLeftPageFlipped, setIsLeftPageFlipped] = useState(false);
const [isFlipping, setIsFlipping] = useState(false);
const [cachedMemory, setCachedMemory] = useState<MemoryWithCoordinates | null>(
  null
);
const [flipDirection, setFlipDirection] = useState<FlipDirection>(null);
```

Related cached values are derived or snapshotted alongside that state:

- `cachedDateInfo` is derived from `cachedMemory`
- `carriedCommentText` stores the in-progress input text during navigation
- `cachedCommentsRef` stores the old comment list for overlay rendering
- `cachedCommentCountRef` stores the old comment count

When the modal closes, flip-related state is reset in a cleanup effect.

## Open And Close Flow

Opening and closing are driven by `animationPhase`, not by page-flip state:

1. `open === true` sets phase to `opening`
2. After `BOOK_OPEN_DURATION`, phase becomes `open`
3. `open === false` sets phase to `closing`
4. After `BOOK_CLOSE_DURATION`, phase becomes `closed`

The covers stay mounted whenever:

```ts
const showCovers = animationPhase !== 'open';
```

That means the pages are always present, and the covers animate over them.

## Page Flip Flow

### Next Navigation

`handleNext` currently does this:

1. Guard against missing navigation target or an in-progress flip
2. Snapshot the comment input and comment data
3. Clear the live input field for the incoming memory
4. Cache the current memory in `cachedMemory`
5. Set `flipDirection` to `'next'`
6. Set `isFlipping` to `true`
7. Call `onNext()` immediately so the base layer renders the new memory
8. Set `isRightPageFlipped(true)` to animate the right-page overlay
9. After `610ms`, clear cached state and reset the flags

Important detail: cleanup uses a hardcoded `610` ms timeout, which is effectively `PAGE_FLIP_DURATION` plus a small buffer.

### Previous Navigation

`handlePrevious` mirrors the same pattern:

1. Snapshot comment input and comment data
2. Cache the current memory
3. Set `flipDirection` to `'prev'`
4. Set `isFlipping` to `true`
5. Call `onPrevious()` immediately
6. Set `isLeftPageFlipped(true)` to animate the left-page overlay
7. After `610ms`, clear cached state and reset the flags

## Base Pages Vs Overlay Pages

The modal keeps the base spread mounted at all times and then conditionally mounts one animated overlay page.

### Base Spread

The base book layout is fixed-size:

- Book wrapper: `968px x 650px`
- Perspective: `2000px`
- Two-page gap: `gap-2`
- Each page width: `472px`

Shared page styles:

```ts
const PAGE_BASE_STYLES =
  'flex flex-col gap-4 rounded-xl bg-stone-50 p-6 px-10 shadow-[1px_2px_3px_0px_rgba(0,0,0,0.25)]';

const PAGE_FACE_STYLES =
  'absolute top-0 left-0 w-full h-full flex flex-col gap-4 rounded-xl bg-stone-50 p-6 px-10 overflow-hidden';
```

Note that `PAGE_FACE_STYLES` intentionally has no shadow to avoid visual stacking artifacts while a page is flipping.

### Base Content During A Flip

The base pages do not always show the live memory during navigation.

Current logic:

```ts
const baseLeftDateInfo = (
  isFlipping && flipDirection === 'next' ? cachedDateInfo : dateInfo
)!;
const baseLeftMemory = (
  isFlipping && flipDirection === 'next' ? cachedMemory : memory
)!;
const baseRightMemory = (
  isFlipping && flipDirection === 'prev' ? cachedMemory : memory
)!;
```

This preserves the reveal:

- During `'next'`, the left base page keeps the old memory until the right-page overlay sweeps across it
- During `'prev'`, the right base page keeps the old memory until the left-page overlay sweeps across it

## Overlay Mapping

Only one flip overlay is mounted at a time, and it always sits above the base pages with `zIndex: 20`.

### Next Flip Overlay

Rendered when:

```tsx
cachedMemory && flipDirection === 'next';
```

Positioning and transform setup:

- `right: '8px'`
- `width: '472px'`
- `transformStyle: 'preserve-3d'`
- `transformOrigin: '0px 50%'`

Content mapping:

- Front face: old right-page content from `cachedMemory`
- Back face: new left-page content from `memory`

This overlay uses `rightPageFlipVariants`, which rotates from `0` to `-180`.

### Previous Flip Overlay

Rendered when:

```tsx
cachedMemory && cachedDateInfo && flipDirection === 'prev';
```

Positioning and transform setup:

- `left: '8px'`
- `width: '472px'`
- `transformStyle: 'preserve-3d'`
- `transformOrigin: '472px 50%'`

Content mapping:

- Front face: old left-page content from `cachedMemory` and `cachedDateInfo`
- Back face: new right-page content from `memory`

This overlay uses `leftPageFlipVariants`, which rotates from `0` to `180`.

## Comments Behavior

The current implementation does more than cache the visible memory. It also stabilizes the comment UI during navigation.

Before either navigation action:

- The current text input is copied into `carriedCommentText.current`
- The current comments are copied into `cachedCommentsRef.current`
- The current count is copied into `cachedCommentCountRef.current`
- The live input is cleared with `setCommentText('')`

During a `'prev'` flip, the exposed base right page uses the cached comment data and cached input text until the overlay covers it.

The overlay comment sections are intentionally non-interactive during the flip:

- `hasMore={false}`
- `isLoadingMore={false}`
- `isSubmitting={false}`
- No-op handlers for submit, delete, load more, and text change

One intentional asymmetry exists:

- The next-flip overlay shows the snapshotted input text
- The previous-flip overlay shows a blank input

That is the current behavior in code and should be treated as authoritative unless the implementation changes.

## Covers And Layering

Current layering looks like this:

1. Modal overlay: `z-50`
2. Book pages: base spread at normal stacking order inside the book
3. Flip overlays: `zIndex: 20`
4. Close button: `z-30`
5. Covers: `zIndex` switches between `30` and `10` through their variants

The spine ring visuals are part of the page content itself:

- `LeftPageSpineRings` lives on the right edge of the left page
- `RightPageSpineRings` lives on the left edge of the right page
- Non-leading rings scale slightly during a flip to reinforce motion

## 3D Requirements

These details are required for the current implementation to look correct:

- Perspective is applied on the wrapper around the book: `perspective: '2000px'`
- The book container and overlay motion elements use `transformStyle: 'preserve-3d'`
- Each page face uses `backfaceVisibility: 'hidden'`
- The back face of each overlay is rotated with `transform: 'rotateY(180deg)'`

Without that combination, the overlay pages will not behave like physical sheets.

## Accuracy Notes

If you are comparing this document to older versions of the code, these are the most important differences:

- `PAGE_FLIP_DURATION` is `0.6`, not `0.8`
- The modal now has an explicit `animationPhase` state machine for covers
- Navigation snapshots comment data, not just memory data
- The base pages temporarily hold old content on one side to preserve the reveal
- Overlay pages use `zIndex: 20`
- `PAGE_FACE_STYLES` no longer includes a shadow

If the implementation changes, update this guide from the source files above rather than from older backups or earlier doc revisions.
