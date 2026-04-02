---
name: sketch
description: Skolaroid Hand-Drawn design system — merged from the original Skolaroid brand and Hand-Drawn sketch aesthetic. Use when building or restyling UI in this project.
---

<role>
You are an expert frontend engineer working on the Skolaroid project. The codebase uses Next.js 16+ (App Router), Tailwind CSS, shadcn/ui primitives (Button, Card, Input, Badge, Dialog), and class-variance-authority (cva).

When writing code, always:

- Use the shadcn primitives from `src/components/ui/` — never create custom button/card/input/badge/dialog markup.
- Apply Hand-Drawn tokens via Tailwind utilities and CSS variables defined in `globals.css`.
- Use `cn()` from `@/lib/utils` to merge classes.
- Apply wobbly borders via the `WOBBLY_RADIUS` / `WOBBLY_RADIUS_MD` constants exported from `@/lib/hand-drawn`.
- Keep `rounded-full` only for true circles (avatars, dots, FABs). All other containers use wobbly inline borderRadius.
- Never use blur-based shadows. Only hard offset shadows.
- Never use `active:scale-*`. Use press-flat (shadow disappears + translate) for buttons, rotation jiggle for cards.
  </role>

<design-system>
# Skolaroid x Hand-Drawn — Merged Design System

## Design Philosophy

The Skolaroid Hand-Drawn style merges nostalgic university-memory aesthetics with an authentic, hand-sketched look. It celebrates imperfection and human touch — evoking scrapbooks, sticky notes, and notebook margins.

**Core Principles:**

- **Wobbly Borders**: Every rectangular container uses irregular `borderRadius` values — never standard `rounded-*` classes. `rounded-full` is reserved for true circles.
- **Hard Offset Shadows**: No blur. Solid offset `box-shadow` only (e.g. `4px 4px 0px 0px #2d2d2d`).
- **Warm Paper Palette**: Background is warm paper (#fdfbf7), foreground is soft pencil black (#2d2d2d), muted is old paper (#e5e0d8). Never pure black or cold grays.
- **Skolaroid Blue**: Brand color `#3F83DB` is kept for primary actions. Hover: `hover:bg-skolaroid-blue/90`.
- **Handwritten Typography**: Kalam (headings, 700), Patrick Hand (body, 400). Dancing Script (`font-dancing`) is reserved for brand identity moments (hero headline, onboarding welcome) only.
- **Playful Rotation**: Small rotation transforms (`rotate-1`, `-rotate-2`) on cards and decorative elements.
- **Scribbled Decoration**: Tape strips, thumbtacks, dashed borders, and hand-drawn SVG flourishes.
- **Polaroid Cards**: A domain-specific component (`<PolaroidCard>`) for memory displays — wobbly borders, hard shadow, `pb-12` white border, slight rotation, optional tape decoration.

## Color Tokens (CSS Variables — Light Mode Only)

| Token                      | Hex       | Usage                                 |
| -------------------------- | --------- | ------------------------------------- |
| `--background`             | `#fdfbf7` | Warm paper page background            |
| `--foreground`             | `#2d2d2d` | Soft pencil black text                |
| `--card`                   | `#ffffff` | Card/container backgrounds            |
| `--card-foreground`        | `#2d2d2d` | Card text                             |
| `--primary`                | `#3F83DB` | Skolaroid blue — primary actions      |
| `--primary-foreground`     | `#ffffff` | Text on primary                       |
| `--secondary`              | `#e5e0d8` | Muted old paper — secondary buttons   |
| `--secondary-foreground`   | `#2d2d2d` | Text on secondary                     |
| `--muted`                  | `#e5e0d8` | Muted backgrounds, disabled states    |
| `--muted-foreground`       | `#6b6560` | Subdued text                          |
| `--accent`                 | `#ff4d4d` | Red correction marker — hover accent  |
| `--accent-foreground`      | `#ffffff` | Text on accent                        |
| `--destructive`            | `#ff4d4d` | Destructive actions (same as accent)  |
| `--destructive-foreground` | `#ffffff` | Text on destructive                   |
| `--border`                 | `#2d2d2d` | Pencil lead borders                   |
| `--input`                  | `#2d2d2d` | Input borders                         |
| `--ring`                   | `#2d5da1` | Focus ring — blue ballpoint pen       |
| `--postit`                 | `#fff9c4` | Post-it yellow for feature highlights |

## Typography

- **Headings**: `font-kalam` — Kalam 700. Dramatic size variation.
- **Body**: `font-hand` — Patrick Hand 400. All UI text, inputs, buttons.
- **Brand**: `font-dancing` — Dancing Script. Hero headline and onboarding welcome only.

## Wobbly Border Radius

Reusable constants in `@/lib/hand-drawn`:

- `WOBBLY_RADIUS`: `"255px 15px 225px 15px / 15px 225px 15px 255px"` — buttons, badges, small elements
- `WOBBLY_RADIUS_MD`: `"15px 255px 15px 225px / 225px 15px 255px 15px"` — cards, containers, dialogs

Apply via `style={{ borderRadius: WOBBLY_RADIUS }}`.

**Exception**: `rounded-full` is kept for true circles (avatars, status dots, circular FABs).

## Shadows

- **Standard**: `shadow-[4px_4px_0px_0px_#2d2d2d]`
- **Emphasized**: `shadow-[8px_8px_0px_0px_#2d2d2d]`
- **Hover (lift)**: `shadow-[2px_2px_0px_0px_#2d2d2d]` + `translate-x-[2px] translate-y-[2px]`
- **Active (press-flat)**: `shadow-none` + `translate-x-[4px] translate-y-[4px]`
- **Subtle (cards)**: `shadow-[3px_3px_0px_0px_rgba(45,45,45,0.1)]`

## Component Patterns

### Button — `default` variant uses Skolaroid blue, press-flat active, wobbly radius

### Card — White bg, `border-2`, wobblyMd radius, subtle hard shadow, hover rotation jiggle

### Input — `border-2`, wobbly radius, `font-hand`, blue focus ring

### Badge — Wobbly radius, `border-2`, `font-hand`, variants: default/secondary/destructive/outline/tag/role/status

### Dialog — Warm paper overlay (no blur), wobblyMd content panel, `border-2`, hard shadow

### PolaroidCard — Memory display: wobbly borders, hard shadow, `pb-12`, slight rotation, optional tape

## Interaction Patterns

- **Buttons**: Press-flat on active (shadow disappears + translate 4px). No `active:scale-*`.
- **Cards**: `hover:rotate-1` / `hover:-rotate-1` jiggle. `transition-transform duration-100`.
- **Disabled**: `bg-muted text-muted-foreground border-dashed cursor-not-allowed opacity-60`

## Paper Texture Background

Applied to `body` via CSS:

```css
body {
  background-image: radial-gradient(#e5e0d8 1px, transparent 1px);
  background-size: 24px 24px;
}
```

</design-system>
