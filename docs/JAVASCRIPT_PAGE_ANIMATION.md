# JAVASCRIPT_PAGE_ANIMATION

This is a vanilla JavaScript port of the current page-flip modal behavior described in [PAGE_FLIP_ANIMATION_GUIDE.md](/c:/Users/Administrator/Documents/Coding/Projects/Skolaroid/docs/PAGE_FLIP_ANIMATION_GUIDE.md).

It keeps the same interaction model:

- Fading backdrop
- Opening and closing book covers
- Mirrored next and previous page flips
- Cached outgoing content during the flip
- Immediate navigation with the incoming content rendered underneath
- Snapshotted comment state so the visible page does not jump during animation

It does not require React. Plain HTML, CSS, and JavaScript are enough.

## What To Keep The Same

To preserve the current behavior from the React version, the JavaScript port should keep these values:

```js
const BOOK_OPEN_DURATION = 800;
const BOOK_CLOSE_DURATION = 1800;
const PAGE_FLIP_DURATION = 600;
const PAGE_FLIP_CLEANUP_DELAY = 610;
```

The book should also keep the same layout geometry:

```js
const BOOK_WIDTH = 968;
const BOOK_HEIGHT = 650;
const PAGE_WIDTH = 472;
const PAGE_GAP = 8;
const BOOK_PADDING = 8;
```

## Recommended File Split

Use three files:

- `page-animation.html`
- `page-animation.css`
- `page-animation.js`

If you want to drop this into another stack later, this split makes it easy to migrate.

## HTML Structure

```html
<div id="memory-modal" class="memory-modal" hidden>
  <div class="memory-overlay" data-overlay></div>

  <div class="memory-dialog">
    <button class="memory-nav memory-nav-prev" data-prev aria-label="Previous">
      ‹
    </button>

    <div class="book-perspective">
      <div class="book" data-book>
        <button class="book-close" data-close aria-label="Close">×</button>

        <div class="book-pages">
          <div class="book-tab" data-location-tab></div>

          <div class="book-spread">
            <section class="page page-left" data-base-left></section>
            <section class="page page-right" data-base-right></section>

            <section
              class="page-overlay page-overlay-left"
              data-prev-overlay
            ></section>
            <section
              class="page-overlay page-overlay-right"
              data-next-overlay
            ></section>
          </div>
        </div>

        <div class="book-cover book-cover-left" data-cover-left>
          <div class="book-cover-face book-cover-front">
            <span>Memories</span>
          </div>
          <div class="book-cover-face book-cover-back"></div>
        </div>

        <div class="book-cover book-cover-right" data-cover-right>
          <div class="book-cover-face book-cover-front">
            <span>Book</span>
          </div>
          <div class="book-cover-face book-cover-back"></div>
        </div>
      </div>
    </div>

    <button class="memory-nav memory-nav-next" data-next aria-label="Next">
      ›
    </button>
  </div>
</div>
```

## CSS Structure

This CSS is the minimum needed to preserve the 3D behavior.

```css
:root {
  --book-open-duration: 800ms;
  --book-close-duration: 1800ms;
  --page-flip-duration: 600ms;
  --ease-cover: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-flip: cubic-bezier(0.4, 0, 1, 1);
  --book-width: 968px;
  --book-height: 650px;
  --page-width: 472px;
  --page-gap: 8px;
}

.memory-modal[hidden] {
  display: none;
}

.memory-modal {
  position: fixed;
  inset: 0;
  z-index: 50;
}

.memory-overlay {
  position: absolute;
  inset: 0;
  background: rgba(45, 45, 45, 0.5);
  opacity: 0;
  transition: opacity 300ms ease;
}

.memory-modal.is-open .memory-overlay {
  opacity: 1;
}

.memory-dialog {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
}

.book-perspective {
  perspective: 2000px;
}

.book {
  position: relative;
  width: var(--book-width);
  height: var(--book-height);
  transform-style: preserve-3d;
}

.book-pages {
  position: absolute;
  inset: 0;
  padding: 8px;
  border-radius: 16px;
  background: #bae6fd;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
  transform-style: preserve-3d;
}

.book-spread {
  position: relative;
  display: flex;
  height: 100%;
  gap: var(--page-gap);
  transform-style: preserve-3d;
}

.page {
  position: relative;
  width: var(--page-width);
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px 40px;
  border-radius: 12px;
  background: #fafaf9;
  box-shadow: 1px 2px 3px rgba(0, 0, 0, 0.25);
  z-index: 1;
}

.page-overlay {
  position: absolute;
  top: 0;
  width: var(--page-width);
  height: 100%;
  transform-style: preserve-3d;
  will-change: transform;
  z-index: 20;
  pointer-events: none;
  opacity: 0;
}

.page-overlay.is-visible {
  opacity: 1;
}

.page-overlay-left {
  left: 8px;
  transform-origin: 472px 50%;
}

.page-overlay-right {
  right: 8px;
  transform-origin: 0 50%;
}

.page-face {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px 40px;
  border-radius: 12px;
  background: #fafaf9;
  overflow: hidden;
  backface-visibility: hidden;
}

.page-face.back {
  transform: rotateY(180deg);
}

.book-cover {
  position: absolute;
  top: 0;
  width: 50%;
  height: 100%;
  background: #bae6fd;
  transform-style: preserve-3d;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.book-cover-left {
  left: 0;
  transform-origin: right center;
}

.book-cover-right {
  right: 0;
  transform-origin: left center;
}

.book-cover-face {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  backface-visibility: hidden;
}

.book-cover-back {
  transform: rotateY(180deg);
  background: #e0f2fe;
}

.book.is-opening .book-cover-left,
.book.is-open .book-cover-left {
  transform: rotateY(-180deg);
  z-index: 10;
  transition: transform var(--book-open-duration) var(--ease-cover);
}

.book.is-opening .book-cover-right,
.book.is-open .book-cover-right {
  transform: rotateY(180deg);
  z-index: 10;
  transition: transform var(--book-open-duration) var(--ease-cover);
}

.book.is-closing .book-cover-left {
  transform: rotateY(0deg);
  z-index: 30;
  transition: transform var(--book-close-duration) var(--ease-cover);
}

.book.is-closing .book-cover-right {
  transform: rotateY(0deg);
  z-index: 30;
  transition: transform var(--book-close-duration) var(--ease-cover);
}

.page-overlay-right.is-flipped {
  transform: rotateY(-180deg);
  transition: transform var(--page-flip-duration) var(--ease-flip);
}

.page-overlay-left.is-flipped {
  transform: rotateY(180deg);
  transition: transform var(--page-flip-duration) var(--ease-flip);
}
```

## JavaScript State Model

This is the closest plain JavaScript equivalent to the current React state:

```js
const state = {
  open: false,
  animationPhase: 'closed',
  isFlipping: false,
  isRightPageFlipped: false,
  isLeftPageFlipped: false,
  flipDirection: null,
  currentIndex: 0,
  cachedMemory: null,
  cachedDateInfo: null,
  carriedCommentText: '',
  cachedComments: [],
  cachedCommentCount: 0,
  commentText: '',
};
```

You should also keep your memory list outside the state object:

```js
const memories = [];
```

## Data Helpers

The port still needs the same derived date data:

```js
function getDateInfo(memory) {
  if (!memory) return null;

  const date = new Date(memory.createdAt || Date.now());
  const currentDay = date.getDay();
  const daysLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'];
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - currentDay);

  return {
    dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }),
    month: date.toLocaleDateString('en-US', { month: 'long' }),
    dayNumber: date.getDate(),
    uploadTime: date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }),
    calendarWeek: Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return {
        label: daysLabels[i],
        number: day.getDate(),
        active: i === currentDay,
      };
    }),
  };
}
```

## Render Rules

The important rule from the React implementation is this:

- On `next`, the left base page temporarily keeps the old content
- On `prev`, the right base page temporarily keeps the old content

That logic becomes:

```js
function getRenderState() {
  const memory = memories[state.currentIndex] || null;
  const dateInfo = getDateInfo(memory);

  const baseLeftMemory =
    state.isFlipping && state.flipDirection === 'next'
      ? state.cachedMemory
      : memory;

  const baseRightMemory =
    state.isFlipping && state.flipDirection === 'prev'
      ? state.cachedMemory
      : memory;

  const baseLeftDateInfo =
    state.isFlipping && state.flipDirection === 'next'
      ? state.cachedDateInfo
      : dateInfo;

  return {
    memory,
    dateInfo,
    baseLeftMemory,
    baseRightMemory,
    baseLeftDateInfo,
  };
}
```

## Open And Close Logic

```js
const modal =
  document.querySelector('[data-modal]') ||
  document.getElementById('memory-modal');
const book = document.querySelector('[data-book]');
const overlay = document.querySelector('[data-overlay]');

function syncBookPhase() {
  book.classList.remove('is-opening', 'is-open', 'is-closing');

  if (state.animationPhase === 'opening') book.classList.add('is-opening');
  if (state.animationPhase === 'open') book.classList.add('is-open');
  if (state.animationPhase === 'closing') book.classList.add('is-closing');
}

function openModal(index) {
  state.currentIndex = index;
  state.open = true;
  state.animationPhase = 'opening';
  modal.hidden = false;
  modal.classList.add('is-open');
  syncBookPhase();
  render();

  window.setTimeout(() => {
    state.animationPhase = 'open';
    syncBookPhase();
  }, BOOK_OPEN_DURATION);
}

function closeModal() {
  state.animationPhase = 'closing';
  syncBookPhase();

  window.setTimeout(() => {
    state.open = false;
    state.animationPhase = 'closed';
    state.isFlipping = false;
    state.isRightPageFlipped = false;
    state.isLeftPageFlipped = false;
    state.flipDirection = null;
    state.cachedMemory = null;
    state.cachedDateInfo = null;
    modal.classList.remove('is-open');
    modal.hidden = true;
    render();
  }, BOOK_CLOSE_DURATION);
}
```

## Next And Previous Logic

This is the direct JavaScript equivalent of the current React behavior.

```js
function snapshotComments() {
  state.carriedCommentText = state.commentText;
  state.cachedComments = getLiveCommentsForMemory(memories[state.currentIndex]);
  state.cachedCommentCount = state.cachedComments.length;
  state.commentText = '';
}

function handleNext() {
  if (state.isFlipping) return;
  if (state.currentIndex >= memories.length - 1) return;

  snapshotComments();
  state.cachedMemory = memories[state.currentIndex];
  state.cachedDateInfo = getDateInfo(state.cachedMemory);
  state.flipDirection = 'next';
  state.isFlipping = true;

  state.currentIndex += 1;
  render();

  state.isRightPageFlipped = true;
  render();

  window.setTimeout(() => {
    state.cachedMemory = null;
    state.cachedDateInfo = null;
    state.flipDirection = null;
    state.isRightPageFlipped = false;
    state.isFlipping = false;
    render();
  }, PAGE_FLIP_CLEANUP_DELAY);
}

function handlePrevious() {
  if (state.isFlipping) return;
  if (state.currentIndex <= 0) return;

  snapshotComments();
  state.cachedMemory = memories[state.currentIndex];
  state.cachedDateInfo = getDateInfo(state.cachedMemory);
  state.flipDirection = 'prev';
  state.isFlipping = true;

  state.currentIndex -= 1;
  render();

  state.isLeftPageFlipped = true;
  render();

  window.setTimeout(() => {
    state.cachedMemory = null;
    state.cachedDateInfo = null;
    state.flipDirection = null;
    state.isLeftPageFlipped = false;
    state.isFlipping = false;
    render();
  }, PAGE_FLIP_CLEANUP_DELAY);
}
```

## Overlay Rendering

Only one overlay should be visible at a time.

### Next Overlay

- Front face uses the old right-page content from `cachedMemory`
- Back face uses the new left-page content from `memories[state.currentIndex]`
- Overlay element gets:
  - `is-visible`
  - `is-flipped` when `state.isRightPageFlipped === true`

### Previous Overlay

- Front face uses the old left-page content from `cachedMemory` and `cachedDateInfo`
- Back face uses the new right-page content from `memories[state.currentIndex]`
- Overlay element gets:
  - `is-visible`
  - `is-flipped` when `state.isLeftPageFlipped === true`

## Plain DOM Rendering Pattern

Use small render helpers instead of one giant function:

```js
function render() {
  const view = getRenderState();

  renderLocationTab(view.memory);
  renderBaseLeft(view.baseLeftMemory, view.baseLeftDateInfo);
  renderBaseRight(view.baseRightMemory);
  renderNextOverlay(view.memory);
  renderPrevOverlay(view.memory);
  renderNavState();
}
```

The important part is not the exact HTML builder you choose. The important part is that your renderer respects the same content ownership rules during the flip.

## Comment Porting Rules

To match the current implementation:

- The visible base right page uses cached comments during a `prev` flip
- The next overlay shows the cached input text
- The previous overlay shows a blank input
- Overlay comment actions should be disabled while flipping

That means your overlay comment markup should be display-only during animation.

## Optional Plugins

No plugin is required for the port.

If you want to replace CSS transitions later, these are safe choices:

- `GSAP` for timeline control
- `Motion One` for small DOM animations
- `imagesLoaded` if you want to delay a render until outgoing and incoming media are both ready

If you use one of those, keep the same state and content-caching strategy. The animation library can change, but the reveal logic should not.

## Porting Checklist

1. Keep the same durations and cleanup delay.
2. Keep the base spread mounted at all times.
3. Update the current index immediately on navigation.
4. Cache the outgoing memory before navigation.
5. Cache comment text and comments before navigation.
6. Hold old content on the exposed base side during the flip.
7. Mount only one overlay page at a time.
8. Use `preserve-3d`, `backface-visibility`, and `rotateY(180deg)` on the correct elements.
9. Disable interaction while a flip is in progress.

## Expected Result

If you follow this structure, the vanilla JavaScript version will behave like the current React implementation:

- The book opens with two animated covers
- `next` flips the right page leftward
- `prev` flips the left page rightward
- The old content stays visually stable during the sweep
- The new content is already rendered underneath when the page turns
- Comments and input state do not visibly jump mid-animation
