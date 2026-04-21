# OPUS MASTER DIRECTIVE

## Jira: Compilation of memories per landmark — Filter by Location + UI Compaction

---

## 1. Feature PRD

### Summary

Three coordinated changes inside the Batches Modal filter panel (`FilterMemoriesModal.tsx`), a new `LocationCombobox` UI primitive, and a data + pipeline update in `batches-modal.tsx`.

**Change A — Sort By: compact to DropdownMenu**
Replace the vertically-stacked `w-full px-4 py-3` button list (4 rows tall) with a single trigger button showing the active label + a chevron, backed by `DropdownMenuRadioGroup` + `DropdownMenuRadioItem`. All 4 options (`date-newest`, `date-oldest`, `upvotes-high`, `upvotes-low`) are preserved verbatim.

**Change B — Visibility: compact to DropdownMenu**
Same treatment as Change A, for the 5 visibility options (`ALL`, `PUBLIC`, `BATCH_ONLY`, `PROGRAM_ONLY`, `GROUP_ONLY`).

**Change C — New Location filter: single-selection Combobox**

- New file: `src/components/ui/location-combobox.tsx` — a fully self-contained, single-selection combobox with live text filtering.
- New field `selectedLocationId: string | null` added to `MemoryFilters` + `DEFAULT_FILTERS`.
- New optional prop `availableLocations?: LocationFilterOption[]` added to `FilterMemoriesModal`.
- `batches-modal.tsx` sources location list from `useLocations()` hook (sorted A–Z, fallback to deriving unique building names from `allMemories`), passes it as `availableLocations`.
- `displayedMemories` pipeline in `batches-modal.tsx` gains a location filter step after the year filter step.
- `handleClearAll` in `FilterMemoriesModal` resets `selectedLocationId` to `null`.

**What does NOT change:**

- `map.tsx` (MapComponent) — its `<FilterMemoriesModal>` call remains untouched. The new `availableLocations` prop defaults to `[]`, so the Location section is simply hidden there.
- The Tags section (badge chips) — unchanged.
- The Year section (badge chips) — unchanged.
- The Group section — unchanged.
- The decade sidebar, search, memory card grid, and all other features of `batches-modal.tsx`.

---

## 2. System Context

| Item               | Detail                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| Framework          | Next.js 16+ App Router, TypeScript                                                                       |
| Styling            | Tailwind CSS + shadcn/ui primitives                                                                      |
| State              | React local `useState` + `useMemo`; TanStack React Query v5 for data                                     |
| Design tokens      | `globals.css` CSS variables; `@/lib/hand-drawn` `WOBBLY_RADIUS` / `WOBBLY_RADIUS_MD`                     |
| Class merging      | `cn()` from `@/lib/utils`                                                                                |
| Existing dropdowns | `@radix-ui/react-dropdown-menu` — already installed, wrapped in `src/components/ui/dropdown-menu.tsx`    |
| No combobox exists | Must build from scratch. Do NOT install any new packages.                                                |
| Location API hook  | `@/lib/hooks/useLocations` → `useLocations()` → `data.data: { id: string, buildingName: string, ... }[]` |
| Memory type        | `MemoryWithCoordinates.location.buildingName: string` (no `location.id` on the memory object)            |
| Filter state shape | `MemoryFilters` in `src/components/map/FilterMemoriesModal.tsx`                                          |
| Filter pipeline    | `displayedMemories` useMemo in `src/components/batches-modal.tsx` lines 129–197                          |

---

## 3. UI/UX Specs (Skolaroid Hand-Drawn Design System)

All new UI must match the existing aesthetic exactly. Key rules:

- **Never** use `rounded-*` Tailwind classes on containers/controls. Apply `style={{ borderRadius: WOBBLY_RADIUS }}` (buttons, inputs, small controls) or `style={{ borderRadius: WOBBLY_RADIUS_MD }}` (larger panels/dropdowns). Import from `@/lib/hand-drawn`.
- **Hard offset shadows only.** Standard: `shadow-[4px_4px_0px_0px_#2d2d2d]`. Hover-lift: `shadow-[2px_2px_0px_0px_#2d2d2d] translate-x-[2px] translate-y-[2px]`. Press-flat: `shadow-none translate-x-[4px] translate-y-[4px]`. Applied only to interactive trigger buttons, not to the dropdown content panel.
- **Colors:** `bg-card` (#ffffff) for controls and dropdown list backgrounds. `bg-foreground text-background` (#2d2d2d / #ffffff) for selected/active items. `text-muted-foreground hover:bg-secondary` for unselected items. `border-2 border-border` for all borders.
- **Typography:** `font-hand text-sm` for all text in the filter panel. Headings `text-sm font-semibold text-foreground`.
- **DropdownMenu content overrides:** The existing `DropdownMenuContent` uses `bg-popover rounded-md shadow-md` — override with `className="border-2 border-border bg-card shadow-[4px_4px_0px_0px_#2d2d2d] p-1"` and `style={{ borderRadius: WOBBLY_RADIUS_MD }}`. Set `sideOffset={6}`.
- **DropdownMenuRadioItem selected state:** Override focus/selected styling with `data-[state=checked]:bg-foreground data-[state=checked]:text-background focus:bg-secondary focus:text-foreground` classes passed via `className`.
- **Combobox dropdown list:** `border-2 border-border bg-card shadow-[4px_4px_0px_0px_#2d2d2d]`, `style={{ borderRadius: WOBBLY_RADIUS_MD }}`, `max-h-48 overflow-y-auto scrollbar-hide`.
- **Combobox input:** Same `border-2 border-border bg-card` and `style={{ borderRadius: WOBBLY_RADIUS }}` as existing `Input` component. `font-hand text-sm placeholder:text-muted-foreground`. Add `focus:ring-2 focus:ring-ring focus:ring-offset-0 focus:outline-none`.
- **Filter panel width** is `w-[288px]` — the new compact dropdowns and combobox must fit within this width without horizontal overflow.

---

## 4. Workflow Map (execute in this exact order)

### Step 1 — Create `src/components/ui/location-combobox.tsx`

Create this file from scratch. Fully controlled, self-contained. No new package installs.

```tsx
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WOBBLY_RADIUS, WOBBLY_RADIUS_MD } from '@/lib/hand-drawn';

export interface ComboboxOption {
  id: string;
  label: string;
}

interface LocationComboboxProps {
  options: ComboboxOption[];
  value: string | null;
  onChange: (id: string | null) => void;
  placeholder?: string;
}

export function LocationCombobox({
  options,
  value,
  onChange,
  placeholder = 'Search location...',
}: LocationComboboxProps) {
  const selectedOption = options.find((o) => o.id === value) ?? null;
  const [inputValue, setInputValue] = useState(selectedOption?.label ?? '');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync display text when the controlled value changes externally
  useEffect(() => {
    setInputValue(selectedOption?.label ?? '');
  }, [value, selectedOption?.label]);

  // Close dropdown and revert input on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setInputValue(selectedOption?.label ?? '');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [selectedOption?.label]);

  const filteredOptions = inputValue.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(inputValue.trim().toLowerCase())
      )
    : options;

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
      setIsOpen(true);
      if (!e.target.value) onChange(null);
    },
    [onChange]
  );

  const handleSelect = useCallback(
    (option: ComboboxOption) => {
      onChange(option.id);
      setInputValue(option.label);
      setIsOpen(false);
    },
    [onChange]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(null);
      setInputValue('');
      setIsOpen(false);
    },
    [onChange]
  );

  return (
    <div ref={containerRef} className="relative">
      {/* Text input */}
      <div className="relative">
        <input
          type="text"
          className={cn(
            'w-full border-2 border-border bg-card px-3 py-2 pr-8',
            'font-hand text-sm text-foreground placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0',
            'transition-shadow'
          )}
          style={{ borderRadius: WOBBLY_RADIUS }}
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
              setInputValue(selectedOption?.label ?? '');
            }
          }}
          aria-label="Filter by location"
          aria-expanded={isOpen}
          role="combobox"
          aria-autocomplete="list"
        />
        {value ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Clear location"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <ChevronDown
            className={cn(
              'pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        )}
      </div>

      {/* Dropdown list */}
      {isOpen && (
        <div
          className="absolute z-50 mt-1 w-full border-2 border-border bg-card shadow-[4px_4px_0px_0px_#2d2d2d]"
          style={{ borderRadius: WOBBLY_RADIUS_MD }}
          role="listbox"
        >
          <div className="scrollbar-hide max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="option"
                  aria-selected={value === option.id}
                  onClick={() => handleSelect(option)}
                  className={cn(
                    'w-full px-3 py-2 text-left font-hand text-sm transition-colors',
                    value === option.id
                      ? 'bg-foreground text-background'
                      : 'text-foreground hover:bg-secondary'
                  )}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 font-hand text-sm text-muted-foreground">
                No matching location
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### Step 2 — Modify `src/components/map/FilterMemoriesModal.tsx`

Apply all changes below in this order.

**2a. Extend `MemoryFilters` interface and `DEFAULT_FILTERS`**

Add `selectedLocationId: string | null` after `selectedGroupId`:

```ts
export interface MemoryFilters {
  sortBy: SortOption;
  visibility: VisibilityFilter;
  selectedTags: string[];
  selectedYear: number | null;
  selectedGroupId: string | null;
  selectedLocationId: string | null; // ← ADD
}

export const DEFAULT_FILTERS: MemoryFilters = {
  sortBy: 'date-newest',
  visibility: 'ALL',
  selectedTags: [],
  selectedYear: null,
  selectedGroupId: null,
  selectedLocationId: null, // ← ADD
};
```

**2b. Add `LocationFilterOption` type and `availableLocations` prop**

Add after `GroupFilterOption`:

```ts
export interface LocationFilterOption {
  id: string;
  name: string;
}
```

Add to `FilterMemoriesModalProps` (after `availableGroups`):

```ts
availableLocations?: LocationFilterOption[];
```

Destructure in the function signature with default `[]`:

```ts
availableLocations = [],
```

**2c. Add new imports**

```ts
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LocationCombobox } from '@/components/ui/location-combobox';
import { WOBBLY_RADIUS, WOBBLY_RADIUS_MD } from '@/lib/hand-drawn';
```

**2d. Replace the Sort By section**

Replace the entire Sort By `<div className="mb-6">` block with:

```tsx
{
  /* Sort By */
}
<div className="mb-6">
  <h3 className="mb-3 text-sm font-semibold text-foreground">Sort By</h3>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button
        className={cn(
          'flex w-full items-center justify-between border-2 border-border bg-card',
          'px-3 py-2 font-hand text-sm text-foreground',
          'shadow-[4px_4px_0px_0px_#2d2d2d]',
          'hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#2d2d2d]',
          'active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
          'transition-all'
        )}
        style={{ borderRadius: WOBBLY_RADIUS }}
      >
        <span>{SORT_OPTIONS.find((o) => o.value === draft.sortBy)?.label}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] border-2 border-border bg-card p-1 shadow-[4px_4px_0px_0px_#2d2d2d]"
      style={{ borderRadius: WOBBLY_RADIUS_MD }}
      sideOffset={6}
    >
      <DropdownMenuRadioGroup
        value={draft.sortBy}
        onValueChange={(v) =>
          setDraft((prev) => ({ ...prev, sortBy: v as SortOption }))
        }
      >
        {SORT_OPTIONS.map((option) => (
          <DropdownMenuRadioItem
            key={option.value}
            value={option.value}
            className={cn(
              'font-hand text-sm text-foreground',
              'focus:bg-secondary focus:text-foreground',
              'data-[state=checked]:bg-foreground data-[state=checked]:text-background'
            )}
          >
            {option.label}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</div>;
```

**2e. Replace the Visibility section**

Replace the entire Visibility `<div className="mb-6">` block with:

```tsx
{
  /* Visibility */
}
<div className="mb-6">
  <h3 className="mb-3 text-sm font-semibold text-foreground">Visibility</h3>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button
        className={cn(
          'flex w-full items-center justify-between border-2 border-border bg-card',
          'px-3 py-2 font-hand text-sm text-foreground',
          'shadow-[4px_4px_0px_0px_#2d2d2d]',
          'hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#2d2d2d]',
          'active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
          'transition-all'
        )}
        style={{ borderRadius: WOBBLY_RADIUS }}
      >
        <span>
          {VISIBILITY_OPTIONS.find((o) => o.value === draft.visibility)?.label}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] border-2 border-border bg-card p-1 shadow-[4px_4px_0px_0px_#2d2d2d]"
      style={{ borderRadius: WOBBLY_RADIUS_MD }}
      sideOffset={6}
    >
      <DropdownMenuRadioGroup
        value={draft.visibility}
        onValueChange={(v) =>
          setDraft((prev) => ({ ...prev, visibility: v as VisibilityFilter }))
        }
      >
        {VISIBILITY_OPTIONS.map((option) => (
          <DropdownMenuRadioItem
            key={option.value}
            value={option.value}
            className={cn(
              'font-hand text-sm text-foreground',
              'focus:bg-secondary focus:text-foreground',
              'data-[state=checked]:bg-foreground data-[state=checked]:text-background'
            )}
          >
            {option.label}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</div>;
```

**2f. Add the Location section**

Insert after the Group section block and before the Tags section:

```tsx
{
  /* Location */
}
{
  availableLocations.length > 0 && (
    <div className="mb-6">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Location</h3>
      <LocationCombobox
        options={availableLocations.map((l) => ({ id: l.id, label: l.name }))}
        value={draft.selectedLocationId}
        onChange={(id) =>
          setDraft((prev) => ({ ...prev, selectedLocationId: id }))
        }
        placeholder="Search location..."
      />
    </div>
  );
}
```

**2g. Verify `handleClearAll`**

`handleClearAll` calls `setDraft(DEFAULT_FILTERS)`. Since `DEFAULT_FILTERS` now includes `selectedLocationId: null`, no further change is needed — just confirm this is the case.

---

### Step 3 — Modify `src/components/batches-modal.tsx`

**3a. Add imports**

```ts
import { useLocations } from '@/lib/hooks/useLocations';
import type { LocationFilterOption } from './map/FilterMemoriesModal';
```

**3b. Call `useLocations` inside the component**

After the existing `useState` declarations:

```ts
const { data: locationsData } = useLocations();
```

**3c. Derive `availableLocations`**

Add a new `useMemo` after the `availableYears` useMemo:

```ts
const availableLocations = useMemo<LocationFilterOption[]>(() => {
  // Prefer real API data sorted A–Z
  if (locationsData?.data?.length) {
    return [...locationsData.data]
      .sort((a, b) => a.buildingName.localeCompare(b.buildingName))
      .map((l) => ({ id: l.id, name: l.buildingName }));
  }
  // Fallback: derive unique building names from loaded memories
  const seen = new Map<string, string>();
  allMemories.forEach((m) => {
    const name = m.location?.buildingName;
    if (name && !seen.has(name)) seen.set(name, name);
  });
  return Array.from(seen.values())
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({ id: name, name }));
}, [locationsData, allMemories]);
```

**3d. Add location filter step to `displayedMemories` pipeline**

Add after the Year filter block and before the Sort switch:

```ts
// Location filter — match memory's building name against selected location
if (filters.selectedLocationId !== null) {
  const selectedLocation = availableLocations.find(
    (l) => l.id === filters.selectedLocationId
  );
  if (selectedLocation) {
    result = result.filter(
      (m) => m.location?.buildingName === selectedLocation.name
    );
  }
}
```

Update the `useMemo` dependency array from:

```ts
[allMemories, selectedDecade, searchQuery, filters];
```

to:

```ts
[allMemories, selectedDecade, searchQuery, filters, availableLocations];
```

**3e. Pass `availableLocations` to `FilterMemoriesModal`**

```tsx
<FilterMemoriesModal
  open={filtersOpen}
  onClose={() => setFiltersOpen(false)}
  filters={filters}
  onApply={setFilters}
  availableTags={availableTags}
  availableYears={availableYears}
  availableLocations={availableLocations}   {/* ← ADD */}
/>
```

---

## 5. Verification Checklist

- [ ] `Sort By` renders a single compact trigger. Clicking opens a dropdown with all 4 options. Active choice shows `bg-foreground text-background`.
- [ ] `Visibility` renders the same pattern with all 5 options.
- [ ] Both dropdown triggers have wobbly border, hard shadow, hover-lift, and press-flat states.
- [ ] `Location` section appears only when `availableLocations.length > 0`.
- [ ] Combobox input is empty on first open (no location selected). `ChevronDown` shown when empty; `X` clear button shown when selected.
- [ ] Typing filters options live. Clicking a location selects it and populates the input.
- [ ] Typing non-matching characters shows "No matching location" — nothing is auto-selected.
- [ ] `Escape` closes the dropdown and reverts input to the last valid selection (or empty).
- [ ] `X` clear button deselects and empties the input.
- [ ] Clicking outside closes dropdown and reverts unconfirmed text.
- [ ] All filters combine via AND logic: decade + location + visibility + tag all applied simultaneously.
- [ ] "Clear All" resets `selectedLocationId` (combobox becomes empty).
- [ ] `map.tsx` `FilterMemoriesModal` instance shows NO Location section (`availableLocations` defaults to `[]`).
- [ ] No TypeScript errors — `selectedLocationId` propagates correctly in both files.
- [ ] All new controls use `font-hand`, `border-2 border-border`, `bg-card`, wobbly radii, and the standard shadow pattern. Nothing looks out of place next to existing Tags/Year badge chips.

---

## Constraints (non-negotiable)

- Do NOT install any new npm packages.
- Do NOT modify `map.tsx`, `color-strip.tsx`, `dropdown-menu.tsx`, `button.tsx`, `input.tsx`, or any file not named in this directive.
- Do NOT use `rounded-*` Tailwind classes on any new container — use `style={{ borderRadius: WOBBLY_RADIUS }}` or `style={{ borderRadius: WOBBLY_RADIUS_MD }}` only.
- Do NOT use `blur`, `backdrop-blur`, `scale`, or `active:scale-*`.
- All text in the filter panel uses `font-hand`. Section headings use `font-semibold text-foreground`.
