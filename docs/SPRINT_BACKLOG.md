# Skolaroid Sprint Backlog

> Derived from: [PRE_BETA_AUDIT_REPORT.md](PRE_BETA_AUDIT_REPORT.md) (April 2, 2026)
> Generated: April 3, 2026

---

## Priority 1 — Critical & Blocking

> Must be completed before any beta testing begins.

---

### AUTH-1: Guard user admin API routes

**As a** platform operator, **I want** all user admin API routes protected by authentication and admin role checks, **so that** unauthenticated or non-admin callers cannot enumerate, delete, or bulk-insert users.

**Deliverables:**

- [ ] Create a reusable `requireAdmin(request)` helper in `src/lib/auth.ts` that verifies the Supabase session and checks `role === 'ADMIN'` on the Prisma `User` row
- [ ] Apply the guard to `src/app/api/prisma/user/get-all/route.ts` — returns 401/403 without valid admin session
- [ ] Apply the guard to `src/app/api/prisma/user/delete/route.ts`
- [ ] Apply the guard to `src/app/api/prisma/user/delete-many/route.ts`
- [ ] Apply the guard to `src/app/api/prisma/user/create-many/route.ts`
- [ ] Manual test: calling any of these routes without auth returns 401; calling with a non-admin user returns 403

**Audit source:** Feature 1 — Loopholes: `/api/prisma/user/get-all` no auth guard, `/api/prisma/user/delete` no auth guard, `/api/prisma/user/delete-many` no auth guard, `/api/prisma/user/create-many` no auth guard; Cross-Cutting — No role-based route protection

---

### AUTH-2: Guard upload API endpoint

**As a** platform operator, **I want** the file upload endpoint to require an authenticated session, **so that** anonymous callers cannot upload files to Supabase storage.

**Deliverables:**

- [ ] Add Supabase session verification to `src/app/api/storage/upload-memory-media/route.ts` — return 401 if no valid session
- [ ] Manual test: unauthenticated POST to the upload route returns 401

**Audit source:** Feature 9 — Loophole: Upload has no auth guard

---

### AUTH-3: Remove dev seed-user fallbacks

**As a** platform operator, **I want** hardcoded seed-user fallbacks removed from production code paths, **so that** unauthenticated users can never vote or comment as a seed user if `NODE_ENV` is misconfigured.

**Deliverables:**

- [ ] In `src/app/api/prisma/memory/vote/toggle/route.ts`, remove the seed-user UUID fallback; return 401 when auth fails regardless of environment
- [ ] In `src/app/api/prisma/memory/comment/create/route.ts`, remove the seed-user UUID fallback; return 401 when auth fails regardless of environment
- [ ] Manual test: calling vote/toggle or comment/create without auth returns 401 in both dev and prod

**Audit source:** Feature 9 — Loophole: Dev-mode seed-user fallback

---

### AUTH-4: Enforce email domain restriction

**As a** platform operator, **I want** only UP-affiliated email addresses to be accepted during registration and onboarding, **so that** Gmail, Outlook, or other non-UP accounts cannot access the platform.

**Deliverables:**

- [ ] Add a Zod `.refine()` to `signUpSchema` and `onboardUserSchema` in `src/lib/schemas.ts` validating the email ends with `@up.edu.ph`, `@upcebu.edu.ph`, or `@alumni.up.edu.ph`
- [ ] Add a server-side domain check in `src/app/api/prisma/user/create/route.ts` that rejects non-UP emails with a 400 response
- [ ] Manual test: attempting to create a user with a Gmail address returns 400 with a clear error message

**Audit source:** Feature 1 — Missing: Email domain restriction; Loophole: Any Google account can register

---

### AUTH-5: Restrict admin page access

**As a** platform operator, **I want** the admin dashboard to be accessible only to users with the `ADMIN` role, **so that** regular users cannot view admin data or controls.

**Deliverables:**

- [ ] Add server-side auth + role check to `src/app/admin/page.tsx` (or its layout); redirect non-admin users to `/` with a 403 status
- [ ] Manual test: a logged-in `USER`-role user navigating to `/admin` is redirected; an `ADMIN` user sees the dashboard

**Audit source:** Cross-Cutting — Admin page accessible to all authenticated users

---

### AUTH-6: Add security response headers

**As a** platform operator, **I want** standard security headers set on all responses, **so that** the app is protected against clickjacking, MIME sniffing, and other common browser attacks.

**Deliverables:**

- [ ] Configure `headers()` in `next.config.ts` to return `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- [ ] Add a baseline `Content-Security-Policy` header allowing Supabase, Mapbox, and Vercel domains
- [ ] Manual test: response headers include all five headers on any page load

**Audit source:** Cross-Cutting — No security headers in `next.config.ts`

---

### AUTH-7: Validate upload file content

**As a** platform operator, **I want** uploaded files validated by magic bytes (not just MIME type), **so that** malicious files with spoofed content types are rejected.

**Deliverables:**

- [ ] In `src/app/api/storage/upload-memory-media/route.ts`, read the first bytes of the uploaded file and verify against known image/video magic byte signatures (JPEG, PNG, GIF, WebP, MP4, WebM)
- [ ] Reject files whose magic bytes don't match with a 400 response
- [ ] Manual test: uploading a `.txt` file renamed to `.jpg` returns 400

**Audit source:** Feature 9 — Loophole: No file content validation

---

### AUTH-8: Add upload rate limiting

**As a** platform operator, **I want** per-user rate limiting on file uploads, **so that** a single user cannot exhaust Supabase storage by flooding the upload endpoint.

**Deliverables:**

- [ ] Implement an in-memory or Redis-backed rate limiter on `src/app/api/storage/upload-memory-media/route.ts` (e.g., max 20 uploads per user per hour)
- [ ] Return 429 with `Retry-After` header when the limit is exceeded
- [ ] Manual test: exceeding the limit returns 429

**Audit source:** Feature 9 — Loophole: 10MB per file with no per-user rate limit; Cross-Cutting — No rate limiting on API routes

---

### AUTH-9: Verify proxy covers all API routes

**As a** platform operator, **I want** the Next.js proxy to enforce authentication on all `/api/prisma/*` routes, **so that** no API endpoint is accidentally left open to unauthenticated access.

**Deliverables:**

- [ ] Audit the `matcher` config in `src/proxy.ts` and confirm it captures all `/api/prisma/*` and `/api/storage/*` paths
- [ ] Add any missing patterns; document the public routes list in a code comment
- [ ] Manual test: calling any `/api/prisma/*` route without a session cookie returns 401 or redirects to login

**Audit source:** Cross-Cutting — API routes beyond proxy scope

---

### TRUST-1: Add approvalStatus to Memory

**As a** platform operator, **I want** every new memory to default to `PENDING` approval status, **so that** user-submitted content does not appear publicly until reviewed.

**Deliverables:**

- [ ] Add an `ApprovalStatus` enum (`PENDING`, `APPROVED`, `REJECTED`) to `prisma/schema.prisma`
- [ ] Add `approvalStatus ApprovalStatus @default(PENDING)` to the `Memory` model
- [ ] Run `prisma migrate dev` to generate and apply the migration
- [ ] Manual test: creating a memory via the API results in `approvalStatus = PENDING` in the database

**Audit source:** Feature 2 — Missing: Content approval model; Loophole: Content is published immediately without review

---

### TRUST-2: Filter queries by approvalStatus

**As a** beta user, **I want** only approved memories to appear in public views, **so that** unreviewed or rejected content is hidden.

**Deliverables:**

- [ ] Update `src/app/api/prisma/memory/get-all-with-coordinates/route.ts` to filter by `approvalStatus: 'APPROVED'` for non-admin users
- [ ] Update `src/app/api/prisma/memory/get-by-location/route.ts` with the same filter
- [ ] Update `src/app/api/prisma/memory/get-by-creator/route.ts` to show all statuses to the creator but only `APPROVED` to others
- [ ] Manual test: a `PENDING` memory is invisible on the map and gallery for other users; visible to its creator

**Audit source:** Feature 2 — Loophole: Content is published immediately without review

---

### STORY-1: Fix hardcoded programBatchId

**As a** user posting a memory, **I want** my memory linked to my actual program-batch, **so that** memories are correctly attributed to the right batch.

**Deliverables:**

- [ ] In `src/components/add-memory-modal.tsx`, replace `MOCK_PROGRAM_BATCH_ID` with the authenticated user's `programBatchId` from `useCurrentUser`
- [ ] Manual test: creating a memory assigns the logged-in user's real `programBatchId`, not a hardcoded UUID

**Audit source:** Feature 9 — Missing: Hardcoded programBatchId

---

### STORY-2: Re-enable upload validation checks

**As a** user posting a memory, **I want** the upload form to validate that a file has been selected before submission, **so that** I cannot accidentally submit an empty memory.

**Deliverables:**

- [ ] In `src/components/add-memory-modal.tsx`, re-enable the upload validation checks that are currently commented out with TODO markers
- [ ] Manual test: attempting to submit the memory form without an uploaded file shows a validation error

**Audit source:** Feature 9 — Missing: Upload check bypassed

---

## Priority 2 — High Impact, Non-Blocking

> Should be completed within the beta sprint window.

---

### APPROVAL-1: Content approval API routes

**As an** admin, **I want** API endpoints for listing pending memories and approving or rejecting them, **so that** I can moderate user-submitted content.

**Deliverables:**

- [ ] Create `src/app/api/prisma/memory/pending/route.ts` — `GET` returns all memories with `approvalStatus: 'PENDING'` (admin-only)
- [ ] Create `src/app/api/prisma/memory/[memoryId]/approve/route.ts` — `PATCH` sets `approvalStatus: 'APPROVED'` (admin-only)
- [ ] Create `src/app/api/prisma/memory/[memoryId]/reject/route.ts` — `PATCH` sets `approvalStatus: 'REJECTED'` with an optional `rejectionReason` (admin-only)
- [ ] Manual test: admin can list pending, approve, and reject; non-admin gets 403

**Audit source:** Feature 2 — Missing: Content approval API routes, Content approval workflow

---

### APPROVAL-2: Wire admin approval UI

**As an** admin, **I want** the admin dashboard to show a real moderation queue instead of mock data, **so that** I can review and act on pending memories.

**Deliverables:**

- [ ] Replace mock data in `src/app/admin/page.tsx` with a `usePendingMemories` hook calling the pending memories API
- [ ] Add Approve / Reject buttons per memory card that call the approve/reject endpoints
- [ ] Manual test: admin sees real pending memories and can approve or reject them; the memory's status updates in real time

**Audit source:** Feature 2 — Missing: Content approval API routes (admin page is entirely mock data)

---

### BATCH-1: Batch archive browser API

**As a** user, **I want** an API endpoint listing all batches with summary stats, **so that** batch archive pages can display member count and memory count.

**Deliverables:**

- [ ] Create `src/app/api/prisma/batch/list/route.ts` — `GET` returns all batches with `_count` of members and memories
- [ ] Add `useBatches` hook in `src/lib/hooks/`
- [ ] Manual test: the endpoint returns an array of batches with accurate counts

**Audit source:** Feature 2 — Missing: Batch archive browser API

---

### BATCH-2: Batch archive listing page

**As a** user, **I want** a dedicated batch archive page to browse batches, **so that** I can explore any batch's memories without relying only on the sidebar.

**Deliverables:**

- [ ] Create `src/app/batches/page.tsx` displaying all batches from the `useBatches` hook as a browsable grid of `batch-card` components
- [ ] Manual test: navigating to `/batches` shows all batches with their year labels and stats

**Audit source:** Feature 2 — Missing: Dedicated batch archive page

---

### BATCH-3: Batch detail page

**As a** user, **I want** a per-batch detail page showing that batch's memories, **so that** I can view a focused archive for a specific graduating class.

**Deliverables:**

- [ ] Create `src/app/batches/[batchId]/page.tsx` that fetches and displays memories filtered by `programBatchId`
- [ ] Manual test: navigating to `/batches/<id>` shows only that batch's approved memories

**Audit source:** Feature 2 — Missing: Dedicated batch archive page (per-batch)

---

### HIGHLIGHTS-1: Story Prisma model + migration

**As a** developer, **I want** a `Story` model in the database, **so that** the story highlights feature has a data layer.

**Deliverables:**

- [ ] Add `Story` model to `prisma/schema.prisma` — id, title, memories (relation), creator, programBatch, createdAt, expiresAt
- [ ] Run `prisma migrate dev` to apply
- [ ] Manual test: the `Story` table exists in the database with all columns

**Audit source:** Feature 2 — Missing: Story model

---

### HIGHLIGHTS-2: Story CRUD API routes

**As a** user, **I want** API endpoints to create, list, and delete stories, **so that** I can curate story highlights for my batch.

**Deliverables:**

- [ ] Create `src/app/api/prisma/story/create/route.ts` — `POST` creates a story linking selected memories
- [ ] Create `src/app/api/prisma/story/list/route.ts` — `GET` returns stories filtered by `programBatchId`
- [ ] Create `src/app/api/prisma/story/[storyId]/delete/route.ts` — `DELETE` soft-deletes a story (creator-only)
- [ ] Add Zod schemas `createStorySchema` and `storyParamsSchema` to `src/lib/schemas.ts`

**Audit source:** Feature 2 — Missing: Story API routes

---

### HIGHLIGHTS-3: Story viewer component

**As a** user, **I want** an Instagram-style story viewer carousel, **so that** I can tap through story highlights.

**Deliverables:**

- [ ] Create `src/components/story/StoryViewer.tsx` — full-screen overlay with left/right tap navigation, progress bar, auto-advance timer
- [ ] Create `useStories` hook in `src/lib/hooks/useStories.ts`
- [ ] Manual test: clicking a story avatar opens the viewer, navigation works, and the viewer closes on completion or swipe-down

**Audit source:** Feature 2 — Missing: Story display components

---

### HIGHLIGHTS-4: Story highlights per batch

**As a** user, **I want** a row of story highlight circles on the batch archive page, **so that** I can see and access curated highlights for each batch.

**Deliverables:**

- [ ] Create `src/components/story/StoryHighlightsRow.tsx` — horizontal scrollable row of circular story avatars
- [ ] Integrate into `src/app/batches/[batchId]/page.tsx` above the memory grid
- [ ] Manual test: batch detail page shows story circles; clicking one opens the `StoryViewer`

**Audit source:** Feature 2 — Missing: Story highlights per batch

---

### HEATMAP-1: Batch-scoped heatmap API

**As a** user, **I want** memory counts per location filtered by batch, **so that** the heatmap shows which campus areas were active for a specific graduating class.

**Deliverables:**

- [ ] Extend `src/app/api/prisma/memory/counts-by-landmark/route.ts` to accept an optional `programBatchId` query parameter and filter accordingly
- [ ] Manual test: calling the endpoint with a `programBatchId` returns only that batch's location counts

**Audit source:** Feature 4 — Missing: Heatmap data endpoint per batch; Loophole: Heatmap based on all-time data

---

### HEATMAP-2: Mapbox heatmap layer + toggle

**As a** user, **I want** a heatmap overlay on the map that I can toggle on and off, **so that** I can visually see campus activity density.

**Deliverables:**

- [ ] Add a Mapbox GL `heatmap` layer to `src/components/map.tsx` sourced from the counts-by-landmark data
- [ ] Add a toggle button in `src/components/map/ActionBar.tsx` to switch between pin view and heatmap view
- [ ] Manual test: clicking the toggle shows the heatmap; toggling again returns to pin view

**Audit source:** Feature 4 — Missing: Heatmap Mapbox layer, Heatmap toggle UI

---

### HEATMAP-3: Heatmap legend component

**As a** user, **I want** a color-scale legend on the heatmap overlay, **so that** I understand what the density colors represent.

**Deliverables:**

- [ ] Create `src/components/map/HeatmapLegend.tsx` — a small floating legend showing the color gradient and corresponding density range
- [ ] Show/hide the legend based on the heatmap toggle state
- [ ] Manual test: legend appears when heatmap is active and disappears when toggled off

**Audit source:** Feature 4 — Missing: Heatmap legend

---

### SEARCH-1: Full-text search migration

**As a** developer, **I want** PostgreSQL trigram indexes on searchable fields, **so that** full-text search queries perform well at scale.

**Deliverables:**

- [ ] Create a Prisma migration that enables `pg_trgm` extension and adds GIN trigram indexes on `Memory.title`, `Memory.description`, `User.firstName`, `User.lastName`, `Location.buildingName`
- [ ] Manual test: the indexes exist in the database after migration

**Audit source:** Feature 5 — Missing: PostgreSQL full-text search or `pg_trgm` index

---

### SEARCH-2: Search API route + schema

**As a** user, **I want** a server-side search endpoint, **so that** I can search across memories, users, tags, and locations with visibility enforcement.

**Deliverables:**

- [ ] Add `searchQuerySchema` to `src/lib/schemas.ts` validating `q` (string, min 1), optional `type` filter, optional `programBatchId`
- [ ] Create `src/app/api/prisma/search/route.ts` — `GET` performs `ILIKE` / trigram queries across Memory, User, Tag, Location; respects `MemoryVisibility`; orders by chronological batch
- [ ] Manual test: searching "campus" returns matching memories and locations; private memories are excluded for unauthorized users

**Audit source:** Feature 5 — Missing: Search API route, Search Zod schema, Chronological results ordering; Loophole: Search result visibility leakage

---

### SEARCH-3: Search bar + hook

**As a** user, **I want** a global search bar in the site header, **so that** I can search from any page.

**Deliverables:**

- [ ] Create `src/components/search-bar.tsx` — text input with debounced onChange, dropdown preview of top results
- [ ] Create `useSearch` hook in `src/lib/hooks/useSearch.ts` calling the search API
- [ ] Integrate the search bar into `src/components/header.tsx`
- [ ] Manual test: typing in the header search bar shows a dropdown with matching results

**Audit source:** Feature 5 — Missing: Search UI component, Search hook

---

### SEARCH-4: Search results page

**As a** user, **I want** a full search results page with categorized results, **so that** I can browse all matches for my query.

**Deliverables:**

- [ ] Create `src/app/search/page.tsx` — reads `q` from URL params, displays Memories, Users, Locations, Tags in tabbed or sectioned layout
- [ ] Manual test: navigating to `/search?q=campus` shows categorized results

**Audit source:** Feature 5 — Missing: Search results page

---

### OTD-1: "On This Day" API route

**As a** user, **I want** an API that returns memories from previous years on today's date, **so that** the platform can surface nostalgic content.

**Deliverables:**

- [ ] Create `src/app/api/prisma/memory/on-this-day/route.ts` — `GET` queries memories where `memoryDate` month+day matches today (Philippines timezone UTC+8); filters by `approvalStatus: 'APPROVED'` and `visibility: 'PUBLIC'`
- [ ] Return an empty array with a 200 when no memories match (graceful empty state)
- [ ] Manual test: inserting a memory with today's month+day from a past year returns it from this endpoint

**Audit source:** Feature 8 — Missing: "On This Day" API route; Loopholes: Visibility filtered, Time zone ambiguity, Empty-state problem

---

### OTD-2: "On This Day" home component

**As a** user, **I want** an "On This Day" carousel on the home page, **so that** I see nostalgic memories when I log in.

**Deliverables:**

- [ ] Create `src/components/on-this-day-carousel.tsx` — horizontal card carousel with memory thumbnails, titles, and years; shows "No memories on this day yet — be the first!" when empty
- [ ] Create `useOnThisDay` hook in `src/lib/hooks/useOnThisDay.ts`
- [ ] Integrate the carousel into `src/app/page.tsx` below the hero section (visible to authenticated users)
- [ ] Manual test: home page shows the carousel; empty state displays the fallback message

**Audit source:** Feature 8 — Missing: "On This Day" component, hook, Home page integration; Loophole: Empty-state problem

---

### FUND-1: Fundraiser model + migration

**As a** developer, **I want** a `Fundraiser` model in the database, **so that** the fundraising feature has a data layer.

**Deliverables:**

- [ ] Add `FundraiserStatus` enum (`PENDING`, `APPROVED`, `ACTIVE`, `COMPLETED`, `REJECTED`) and `Fundraiser` model (title, description, targetAmount, currentAmount, creator, status, startDate, endDate, proofDocuments) to `prisma/schema.prisma`
- [ ] Run `prisma migrate dev` to apply
- [ ] Manual test: the `Fundraiser` table exists with all expected columns

**Audit source:** Feature 7 — Missing: Fundraising Prisma model

---

### FUND-2: Fundraiser schemas + hooks

**As a** developer, **I want** Zod schemas and React Query hooks for fundraisers, **so that** client and server validation are consistent and the UI has data access.

**Deliverables:**

- [ ] Add `createFundraiserSchema`, `updateFundraiserSchema`, `approveFundraiserSchema` to `src/lib/schemas.ts`
- [ ] Create `useCreateFundraiser`, `useFundraisers`, `useFundraiserById` hooks in `src/lib/hooks/`
- [ ] Manual test: hooks return expected types; schemas reject invalid input

**Audit source:** Feature 7 — Missing: Fundraiser Zod schemas, Fundraiser hooks

---

### FUND-3: Fundraiser CRUD API routes

**As a** user, **I want** API endpoints to create, list, view, update, and delete fundraisers, **so that** the fundraising platform can function end-to-end.

**Deliverables:**

- [ ] Create `src/app/api/prisma/fundraiser/create/route.ts` — `POST` (authenticated, status defaults to `PENDING`)
- [ ] Create `src/app/api/prisma/fundraiser/list/route.ts` — `GET` returns `ACTIVE` + `COMPLETED` fundraisers publicly
- [ ] Create `src/app/api/prisma/fundraiser/[id]/route.ts` — `GET` single fundraiser detail
- [ ] Create `src/app/api/prisma/fundraiser/[id]/update/route.ts` — `PATCH` (creator-only or admin)
- [ ] Create `src/app/api/prisma/fundraiser/[id]/delete/route.ts` — `DELETE` (creator-only or admin)
- [ ] All routes enforce auth; only `APPROVED`/`ACTIVE`/`COMPLETED` visible publicly

> **Flag:** 3-day estimate — if scope slips, split update+delete into FUND-3b

**Audit source:** Feature 7 — Missing: Fundraiser API routes; Loophole: Fraud vector (auth enforcement), Stale campaigns (status-based visibility)

---

### FUND-4: Fundraiser approval API

**As an** admin, **I want** endpoints to approve or reject fundraiser applications, **so that** only vetted campaigns go live.

**Deliverables:**

- [ ] Create `src/app/api/prisma/fundraiser/[id]/approve/route.ts` — `PATCH` (admin-only, sets status to `APPROVED`)
- [ ] Create `src/app/api/prisma/fundraiser/[id]/reject/route.ts` — `PATCH` (admin-only, sets status to `REJECTED` with reason)
- [ ] Manual test: admin can approve/reject; non-admin gets 403

**Audit source:** Feature 7 — Missing: Application/approval process, Admin fundraiser management

---

### FUND-5: Fundraiser listing page

**As a** user, **I want** a public fundraising listing page, **so that** I can browse active campaigns.

**Deliverables:**

- [ ] Create `src/app/fundraising/page.tsx` — grid of `FundraiserCard` components showing title, progress bar, goal amount, and status
- [ ] Create `src/components/fundraiser/FundraiserCard.tsx`
- [ ] Manual test: `/fundraising` shows only `ACTIVE`/`COMPLETED` campaigns

**Audit source:** Feature 7 — Missing: Fundraiser page, Fundraiser components

---

### FUND-6: Fundraiser detail page

**As a** user, **I want** a fundraiser detail page, **so that** I can read the full description, see proof documents, and track progress toward the goal.

**Deliverables:**

- [ ] Create `src/app/fundraising/[id]/page.tsx` with full fundraiser detail (description, creator, progress, documents, dates)
- [ ] Manual test: navigating to `/fundraising/<id>` shows the complete fundraiser detail

**Audit source:** Feature 7 — Missing: Fundraiser components (FundraiserDetailView)

---

### FUND-7: Create fundraiser modal

**As a** user, **I want** a modal to submit a new fundraiser application, **so that** I can propose a campaign for admin review.

**Deliverables:**

- [ ] Create `src/components/fundraiser/CreateFundraiserModal.tsx` — form with title, description, target amount, start/end dates, proof document upload
- [ ] Wire to `useCreateFundraiser` hook
- [ ] Manual test: submitting the form creates a `PENDING` fundraiser in the database

**Audit source:** Feature 7 — Missing: Fundraiser components (CreateFundraiserModal)

---

### GROUP-1: Group edit API route

**As a** group creator, **I want** an API endpoint to update my group's name and description, **so that** I can correct information after creation.

**Deliverables:**

- [ ] Create `src/app/api/prisma/group/[groupId]/update/route.ts` — `PATCH` (creator-only), validates with `updateGroupServerSchema`
- [ ] Manual test: group creator can update name/description; non-creator gets 403

**Audit source:** Feature 6 — Missing: Group edit/update API route

---

### GROUP-2: Group edit UI modal

**As a** group creator, **I want** an edit modal for my group, **so that** I can change the group name and description from the UI.

**Deliverables:**

- [ ] Create `src/components/groups/EditGroupModal.tsx` — form pre-filled with current group data, calls the update endpoint
- [ ] Create `useUpdateGroup` hook in `src/lib/hooks/`
- [ ] Add an "Edit" button to `src/components/groups/GroupPanel.tsx` (visible to the group creator only)
- [ ] Manual test: creator clicks Edit, changes the name, saves; panel reflects the new name

**Audit source:** Feature 6 — Missing: Group edit UI

---

### GROUP-3: Add public group type

**As a** user, **I want** groups to support a public/organization type alongside private, **so that** org-level archives can be browsable by all users.

**Deliverables:**

- [ ] Add `GroupType` enum (`PRIVATE`, `ORGANIZATION`) to `prisma/schema.prisma`; add `type GroupType @default(PRIVATE)` to `PrivateGroup`
- [ ] Run `prisma migrate dev`
- [ ] Update `src/app/api/prisma/group/list/route.ts` to return `ORGANIZATION` groups to all authenticated users and `PRIVATE` groups only to members
- [ ] Manual test: creating a group with type `ORGANIZATION` makes it visible to all users

**Audit source:** Feature 6 — Missing: Organization-level archives

---

### MAP-1: Add location categorization

**As a** user, **I want** locations categorized as academic or non-academic, **so that** I can filter the map by activity type.

**Deliverables:**

- [ ] Add `category String?` (e.g., `ACADEMIC`, `NON_ACADEMIC`) to `Location` model in `prisma/schema.prisma`; run migration
- [ ] Update landmark constants in `src/lib/constants/landmarks.ts` with category annotations
- [ ] Update `FilterMemoriesModal.tsx` to include a category filter option
- [ ] Manual test: filtering by `ACADEMIC` shows only academic locations on the map

**Audit source:** Feature 3 — Missing: Location categorization

---

### MAP-2: GPS coordinate bounding box

**As a** platform operator, **I want** custom location creation to validate coordinates against a reasonable geographic bounding box, **so that** obviously invalid locations (oceans, other countries) are rejected.

**Deliverables:**

- [ ] In `src/app/api/prisma/location/create-custom/route.ts`, add bounding box validation (roughly Cebu metro area + reasonable buffer, e.g., 9.5–11.5°N, 123–124.5°E)
- [ ] Return 400 with a clear message for out-of-bounds coordinates
- [ ] Manual test: submitting coordinates in the Pacific Ocean returns 400

**Audit source:** Feature 3 — Loophole: GPS coordinate spoofing

---

### PROFILE-1: Extend User model schema

**As a** developer, **I want** `bio`, `contactInfo`, and `avatarUrl` fields on the `User` model, **so that** profile editing has a data layer.

**Deliverables:**

- [ ] Add `bio String?`, `contactInfo Json?`, `avatarUrl String?` to the `User` model in `prisma/schema.prisma`
- [ ] Run `prisma migrate dev`
- [ ] Manual test: the three new columns exist in the `User` table

**Audit source:** Feature 1 — Missing: Profile bio field, Profile contactInfo field, Profile avatarUrl field

---

### PROFILE-2: Profile update API route

**As a** user, **I want** an API endpoint to update my profile, **so that** I can set my bio, contact info, and avatar.

**Deliverables:**

- [ ] Create `src/app/api/prisma/user/update/route.ts` — `PATCH` accepts `bio`, `contactInfo`, `avatarUrl`; validates with a new `updateProfileSchema`; ensures the caller can only update their own row
- [ ] Add `updateProfileSchema` to `src/lib/schemas.ts`
- [ ] Manual test: authenticated user can PATCH their own profile; updating another user's profile returns 403

**Audit source:** Feature 1 — Missing: Profile edit API route

---

### PROFILE-3: Profile edit UI + hook

**As a** user, **I want** an edit profile modal, **so that** I can update my bio, contact info, and avatar from the profile page.

**Deliverables:**

- [ ] Create `src/components/profile/EditProfileModal.tsx` — form fields for bio (textarea), contact links (inputs), avatar (file upload)
- [ ] Create `useUpdateProfile` hook in `src/lib/hooks/useUpdateProfile.ts`
- [ ] Enable the "Edit Profile" button in `src/components/profile/ProfileHero.tsx` to open the modal
- [ ] Manual test: editing bio and saving reflects the change on the profile page

**Audit source:** Feature 1 — Missing: Profile edit UI, Profile edit hook

---

### MEMORY-1: Memory edit API route

**As a** user, **I want** an API endpoint to edit my memory after posting, **so that** I can fix typos or change visibility.

**Deliverables:**

- [ ] Create `src/app/api/prisma/memory/[memoryId]/update/route.ts` — `PATCH` accepts title, description, visibility, memoryDate; creator-only
- [ ] Add `updateMemorySchema` to `src/lib/schemas.ts`
- [ ] Manual test: creator can update; non-creator gets 403

**Audit source:** Feature 9 — Missing: Memory edit API route

---

### MEMORY-2: Memory edit UI modal

**As a** user, **I want** an edit button on my memory detail view, **so that** I can change the title, description, or visibility.

**Deliverables:**

- [ ] Create `src/components/map/EditMemoryModal.tsx` — form pre-filled with current memory data
- [ ] Create `useUpdateMemory` hook in `src/lib/hooks/useUpdateMemory.ts`
- [ ] Add an "Edit" action to `src/components/map/MemoryDetailModal.tsx` (visible to the memory creator only)
- [ ] Manual test: creator clicks Edit, changes description, saves; detail modal reflects the update

**Audit source:** Feature 9 — Missing: Memory edit UI

---

### VALID-1: Validate batch membership on post

**As a** platform operator, **I want** the memory creation route to verify the user's `programBatchId` matches the memory's target batch, **so that** users cannot post memories attributed to another batch.

**Deliverables:**

- [ ] In `src/app/api/prisma/memory/create/route.ts`, compare the request's `programBatchId` with the authenticated user's `programBatchId`; return 403 if they don't match
- [ ] Manual test: a user from batch 2020 submitting to batch 2015 gets 403

**Audit source:** Feature 2 — Loophole: No batch membership validation

---

## Priority 3 — Stabilization & Polish

> Improves robustness and UX before beta users onboard.

---

### ERRH-1: Add error + global-error boundaries

**As a** user, **I want** a styled error page instead of a blank white screen when something breaks, **so that** I know the app is still working and can navigate away.

**Deliverables:**

- [ ] Create `src/app/global-error.tsx` — catches root layout errors with a "Something went wrong" UI and retry button
- [ ] Create `src/app/error.tsx` — catches segment-level errors with a friendly message
- [ ] Create `src/app/map/error.tsx` and `src/app/gallery/error.tsx` with context-appropriate messages
- [ ] Manual test: throwing an error in a page component shows the error boundary instead of blank screen

**Audit source:** Cross-Cutting — No `error.tsx`, No `global-error.tsx`

---

### ERRH-2: Add not-found page

**As a** user, **I want** a custom 404 page, **so that** invalid URLs show a helpful "page not found" screen with navigation options.

**Deliverables:**

- [ ] Create `src/app/not-found.tsx` — styled 404 page with a link back to home and search
- [ ] Manual test: navigating to `/nonexistent-page` shows the custom 404

**Audit source:** Cross-Cutting — No `not-found.tsx`

---

### ERRH-3: Add loading states

**As a** user, **I want** loading indicators during route transitions, **so that** I know the page is responding.

**Deliverables:**

- [ ] Create `src/app/loading.tsx` — skeleton or spinner for the root layout
- [ ] Create `src/app/map/loading.tsx` — skeleton matching the map page layout
- [ ] Manual test: navigating to `/map` shows the loading skeleton before the map renders

**Audit source:** Cross-Cutting — No `loading.tsx`

---

### VALID-2: Remove mock data fallbacks

**As a** platform operator, **I want** mock/placeholder data removed from production components, **so that** real users never see fake content.

**Deliverables:**

- [ ] In `src/components/batches-modal.tsx`, remove the `MOCK_MEMORIES` fallback; show an empty state when no real data exists
- [ ] In `src/components/notifications-menu.tsx`, remove mock notification data; show "No notifications yet" until the feature is wired
- [ ] Manual test: both components show empty states instead of fake data when no real data is available

**Audit source:** Feature 2 — Loophole: Mock data fallback in batches-modal; (notifications are mock per component audit)

---

### VALID-3: Add composite database indexes

**As a** developer, **I want** composite indexes on frequent query patterns, **so that** query performance doesn't degrade as data grows.

**Deliverables:**

- [ ] Add composite index on `Memory(programBatchId, visibility, deletedAt)` in `prisma/schema.prisma`
- [ ] Add composite index on `MemoryComment(memoryId, deletedAt, createdAt)` in `prisma/schema.prisma`
- [ ] Run `prisma migrate dev`
- [ ] Manual test: `\d Memory` in psql shows the new indexes

**Audit source:** Cross-Cutting — Missing composite indexes

---

### VALID-4: Add pagination to list endpoints

**As a** developer, **I want** pagination on user and location listing endpoints, **so that** they don't return unbounded result sets.

**Deliverables:**

- [ ] Update `src/app/api/prisma/user/get-all/route.ts` to accept `page` and `limit` query params (default limit 50)
- [ ] Update `src/app/api/prisma/location/get-all/route.ts` with the same pagination
- [ ] Manual test: both endpoints return paginated results with `total`, `page`, `limit` metadata

**Audit source:** Cross-Cutting — No pagination on user/location listing

---

### VALID-5: Validate GET query params

**As a** developer, **I want** all GET API routes to validate query parameters with Zod, **so that** unexpected inputs are rejected consistently.

**Deliverables:**

- [ ] Audit all `GET` routes under `src/app/api/prisma/`; add Zod `searchParams` parsing where missing (e.g., `get-all` routes, `get-by-location`, `counts-by-landmark`)
- [ ] Return 400 with validation errors for invalid query strings
- [ ] Manual test: passing non-numeric `page` returns 400

**Audit source:** Cross-Cutting — Inconsistent validation

---

### PROFILE-4: Activity timeline API + UI

**As a** user, **I want** my profile to show an activity timeline, **so that** I can see my memories, votes, and comments at a glance.

**Deliverables:**

- [ ] Create `src/app/api/prisma/user/activity/route.ts` — `GET` aggregates the authenticated user's memories, votes, and comments with timestamps
- [ ] Wire the data into `src/components/profile/ProfileActivityCard.tsx`
- [ ] Manual test: profile page shows the user's real activity history

**Audit source:** Feature 1 — Missing: Activity timeline component

---

### PROFILE-5: Account deletion flow

**As a** user, **I want** to delete my account and all associated data, **so that** I can exercise data removal rights.

**Deliverables:**

- [ ] Create `src/app/api/prisma/user/delete-self/route.ts` — authenticates, soft-deletes or hard-deletes the caller's user row + cascades to memories/comments/votes
- [ ] Enable the "Delete Account" button in `src/components/profile/ProfileSettingsCard.tsx` with a confirmation dialog
- [ ] Manual test: user confirms deletion → account is removed → user is logged out

**Audit source:** Feature 1 — Missing: Account deletion

---

### ONBOARD-1: Handle onboarding race condition

**As a** developer, **I want** the user creation route to use Prisma `upsert` and handle unique constraint violations explicitly, **so that** concurrent onboarding requests don't create duplicate rows.

**Deliverables:**

- [ ] In `src/app/api/prisma/user/create/route.ts`, replace `create` with `upsert` on the `email` field, or catch `PrismaClientKnownRequestError` code `P2002` and return the existing user
- [ ] Manual test: two simultaneous POST requests for the same email result in one user row

**Audit source:** Feature 1 — Loophole: Race condition on onboarding

---

### MEMORY-3: Map visibility gating

**As a** user without memories, **I want** to see a prompt encouraging me to post my first memory, **so that** the map incentivizes contributions as specified in the project brief.

**Deliverables:**

- [ ] Add logic in `src/components/map.tsx` or the map data hook to check if the current user has any memories; if not, show a dismissible banner: "You haven't posted a memory yet! Post one to show up on the map."
- [ ] Manual test: a new user with zero memories sees the prompt; a user with memories does not

**Audit source:** Feature 9 — Missing: Map visibility gating

---

### MEMORY-4: Profile ring indicator

**As a** user, **I want** an Instagram-like ring around profile pictures of active storytellers, **so that** contributors are visually recognized.

**Deliverables:**

- [ ] Add conditional ring styling (colored border) around the avatar in `src/components/account-menu.tsx` and `src/components/profile/ProfileHero.tsx` when the user has at least one memory
- [ ] Manual test: a user with memories has a colored ring; a user without does not

**Audit source:** Feature 9 — Missing: Profile ring indicator

---

### INFRA-1: Configure connection pooling

**As a** developer, **I want** explicit connection pool settings in the Prisma/pg setup, **so that** production database connections are managed efficiently.

**Deliverables:**

- [ ] In `src/lib/prisma.ts`, configure the `pg Pool` with explicit `max`, `idleTimeoutMillis`, and `connectionTimeoutMillis` values suitable for Vercel serverless (e.g., max 5, idle timeout 10s)
- [ ] Manual test: the pool settings are applied in production logs

**Audit source:** Cross-Cutting — No database connection pooling configuration

---

### INFRA-2: Add health check endpoint

**As a** platform operator, **I want** a `/api/health` endpoint, **so that** uptime monitoring can ping the app.

**Deliverables:**

- [ ] Create `src/app/api/health/route.ts` — `GET` returns `{ status: 'ok', timestamp }` with a 200; optionally pings the database
- [ ] Manual test: `GET /api/health` returns 200

**Audit source:** Cross-Cutting — No health check endpoint

---

### INFRA-3: Integrate error tracking

**As a** platform operator, **I want** server-side errors reported to Sentry, **so that** production issues are detected and diagnosed.

**Deliverables:**

- [ ] Install `@sentry/nextjs` and configure `sentry.server.config.ts`, `sentry.client.config.ts`, `sentry.edge.config.ts`
- [ ] Wire into `global-error.tsx` and API route error handlers
- [ ] Manual test: throwing a test error in an API route creates a Sentry event

**Audit source:** Cross-Cutting — No error tracking

---

### INFRA-4: Schedule invitation cleanup

**As a** platform operator, **I want** expired invitations automatically cleaned up, **so that** stale tokens don't accumulate in the database.

**Deliverables:**

- [ ] Configure a Vercel Cron Job (in `vercel.json`) to call `src/app/api/prisma/invitation/cleanup/route.ts` daily
- [ ] Add `CRON_SECRET` to environment variables and validate it in the cleanup route
- [ ] Manual test: running the cron manually deletes invitations past `expiresAt`

**Audit source:** Feature 6 — Loophole: Invitation cleanup not scheduled; Cross-Cutting — `CRON_SECRET` needed

---

### INFRA-5: Ensure production env vars

**As a** platform operator, **I want** all required environment variables documented and validated at startup, **so that** missing config doesn't cause silent failures.

**Deliverables:**

- [ ] Create `src/lib/env.ts` that validates required env vars (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`) at import time using Zod; throw on missing
- [ ] Import `env.ts` in the root layout or instrumentation file
- [ ] Manual test: removing `RESEND_API_KEY` from env causes a startup error with a clear message

**Audit source:** Cross-Cutting — `RESEND_API_KEY` and `RESEND_FROM_EMAIL` needed, `CRON_SECRET` needed

---

### A11Y-1: Fix modal accessibility

**As a** user relying on assistive technology, **I want** all modals to have correct ARIA attributes and focus management, **so that** the app is usable with screen readers and keyboards.

**Deliverables:**

- [ ] Audit `MemoryDetailModal`, `GroupPanel`, batch sidebar, and other custom modals for `aria-label`, `aria-expanded`, `role`, and focus trapping
- [ ] Add missing attributes and ensure focus returns to the trigger element on close
- [ ] Manual test: navigating modals with Tab key keeps focus trapped; screen reader announces modal title

**Audit source:** Cross-Cutting — Inconsistent `aria-*` attributes, Focus management in modals

---

### A11Y-2: Map keyboard navigation

**As a** keyboard-only user, **I want** map pins and landmark markers to be focusable and activatable, **so that** I can interact with the map without a mouse.

**Deliverables:**

- [ ] Add `tabindex="0"` and `keydown` handlers (Enter/Space to open) to `MemoryPin`, `LandmarkMarker` components
- [ ] Manual test: Tab-navigating to a pin and pressing Enter opens the detail modal

**Audit source:** Cross-Cutting — Keyboard navigation

---

### MOBILE-1: Responsive map layout

**As a** mobile user, **I want** the map, modals, and gallery to be usable on small screens, **so that** the app works on my phone.

**Deliverables:**

- [ ] Adjust `MemoryDetailModal` flip animation to a slide-up sheet on viewports < 768px
- [ ] Ensure `SinglePhoto` and other gallery layouts cap at 100% viewport width on mobile
- [ ] Manual test: map, modal, and gallery render correctly on a 375px-wide viewport

**Audit source:** Cross-Cutting — Map not optimized for mobile, Memory detail modal, Gallery fixed-width polaroid layouts

---

### GROUP-4: Relax global group name uniqueness

**As a** user, **I want** to create a group with any name regardless of other groups' names, **so that** naming conflicts between unrelated groups are eliminated.

**Deliverables:**

- [ ] Remove `@unique` from `PrivateGroup.name` in `prisma/schema.prisma`; add a composite unique on `[name, creatorId]` instead (or remove uniqueness entirely)
- [ ] Run `prisma migrate dev`
- [ ] Manual test: two different users can create groups with the same name

**Audit source:** Feature 6 — Loophole: Group name uniqueness is global

---

## Nice-to-Have Stories (Post-Beta)

> Sourced from the Nice-to-Have section of the audit report. Do not schedule these in the beta sprint.

---

### NICE-1: Activate dark mode

**Deliverables:**

- [ ] Configure `next-themes` provider with a campus-themed dark palette and add a theme toggle to the header

**Why it matters:** `next-themes` is already installed — low effort for a big UX upgrade.

---

### NICE-2: Wire notification system

**Deliverables:**

- [ ] Replace mock data in `notifications-menu.tsx` with a real backend (polling or SSE) for comments, votes, and group invites

**Why it matters:** Drives re-engagement and makes the platform feel alive.

---

### NICE-3: Batch timeline visualization

**Deliverables:**

- [ ] Create a chronological timeline component per batch showing key events, milestones, and memories

**Why it matters:** Gives each graduating class a rich, navigable history view.

---

### NICE-4: Multi-image memory carousel

**Deliverables:**

- [ ] Support multiple image uploads per memory with a swipeable carousel in the detail modal

**Why it matters:** Alumni often want to share entire photo sets from a single event.

---

### NICE-5: Social sharing OG images

**Deliverables:**

- [ ] Expand `src/app/preview-memory-card/` to generate Open Graph images for social media sharing of memory cards

**Why it matters:** Viral loop — shared memories bring new alumni to the platform.

---

### NICE-6: Leaderboard + contribution stats

**Deliverables:**

- [ ] Create a leaderboard page showing top contributors per batch, most-voted memories, and engagement metrics

**Why it matters:** Gamification drives consistent content creation.

---

### NICE-7: Analytics dashboard (admin)

**Deliverables:**

- [ ] Build an admin analytics view showing platform-wide metrics: total memories, active users, most-photographed locations, batch engagement rates

**Why it matters:** Demonstrates traction to investors with quantifiable metrics.

---

### NICE-8: Export batch archives as PDF

**Deliverables:**

- [ ] Allow alumni associations to export a batch's memories as a PDF yearbook or ZIP

**Why it matters:** Demonstrates institutional value and data portability.

---

### NICE-9: AI-powered auto-captioning

**Deliverables:**

- [ ] Use a Vision API to suggest memory descriptions from uploaded photos

**Why it matters:** Reduces friction for posting and demonstrates technical sophistication.

---

### NICE-10: Multi-university architecture

**Deliverables:**

- [ ] Abstract `University` as a top-level entity in the Prisma schema to support expansion beyond UP Cebu

**Why it matters:** Demonstrates market expansion potential to investors.

---

## Sprint Summary

| ID           | Title                               | Priority  | Est. Days |
| ------------ | ----------------------------------- | --------- | --------- |
| AUTH-1       | Guard user admin routes             | P1        | 2         |
| AUTH-2       | Guard upload API endpoint           | P1        | 1         |
| AUTH-3       | Remove dev seed-user fallbacks      | P1        | 1         |
| AUTH-4       | Enforce email domain restriction    | P1        | 2         |
| AUTH-5       | Restrict admin page access          | P1        | 1         |
| AUTH-6       | Add security response headers       | P1        | 1         |
| AUTH-7       | Validate upload file content        | P1        | 2         |
| AUTH-8       | Add upload rate limiting            | P1        | 2         |
| AUTH-9       | Verify proxy API coverage           | P1        | 1         |
| TRUST-1      | Add Memory approvalStatus field     | P1        | 1         |
| TRUST-2      | Filter queries by approval          | P1        | 2         |
| STORY-1      | Fix hardcoded programBatchId        | P1        | 1         |
| STORY-2      | Re-enable upload validation         | P1        | 1         |
|              | **P1 Subtotal**                     |           | **18**    |
| APPROVAL-1   | Content approval API routes         | P2        | 2         |
| APPROVAL-2   | Wire admin approval UI              | P2        | 3         |
| BATCH-1      | Batch archive browser API           | P2        | 2         |
| BATCH-2      | Batch archive listing page          | P2        | 2         |
| BATCH-3      | Batch detail page                   | P2        | 2         |
| HIGHLIGHTS-1 | Story model + migration             | P2        | 1         |
| HIGHLIGHTS-2 | Story CRUD API routes               | P2        | 3         |
| HIGHLIGHTS-3 | Story viewer component              | P2        | 3         |
| HIGHLIGHTS-4 | Story highlights per batch          | P2        | 2         |
| HEATMAP-1    | Batch-scoped heatmap API            | P2        | 2         |
| HEATMAP-2    | Mapbox heatmap layer + toggle       | P2        | 3         |
| HEATMAP-3    | Heatmap legend component            | P2        | 1         |
| SEARCH-1     | Full-text search migration          | P2        | 1         |
| SEARCH-2     | Search API route + schema           | P2        | 2         |
| SEARCH-3     | Search bar + hook                   | P2        | 2         |
| SEARCH-4     | Search results page                 | P2        | 2         |
| OTD-1        | "On This Day" API route             | P2        | 2         |
| OTD-2        | "On This Day" home component        | P2        | 2         |
| FUND-1       | Fundraiser model + migration        | P2        | 1         |
| FUND-2       | Fundraiser schemas + hooks          | P2        | 2         |
| FUND-3       | Fundraiser CRUD API routes          | P2        | 3         |
| FUND-4       | Fundraiser approval API             | P2        | 2         |
| FUND-5       | Fundraiser listing page             | P2        | 2         |
| FUND-6       | Fundraiser detail page              | P2        | 2         |
| FUND-7       | Create fundraiser modal             | P2        | 2         |
| GROUP-1      | Group edit API route                | P2        | 1         |
| GROUP-2      | Group edit UI modal                 | P2        | 2         |
| GROUP-3      | Add public group type               | P2        | 2         |
| MAP-1        | Add location categorization         | P2        | 2         |
| MAP-2        | GPS coordinate bounding box         | P2        | 1         |
| PROFILE-1    | Extend User model schema            | P2        | 1         |
| PROFILE-2    | Profile update API route            | P2        | 2         |
| PROFILE-3    | Profile edit UI + hook              | P2        | 3         |
| MEMORY-1     | Memory edit API route               | P2        | 2         |
| MEMORY-2     | Memory edit UI modal                | P2        | 2         |
| VALID-1      | Validate batch membership           | P2        | 1         |
|              | **P2 Subtotal**                     |           | **68**    |
| ERRH-1       | Add error + global-error boundaries | P3        | 2         |
| ERRH-2       | Add not-found page                  | P3        | 1         |
| ERRH-3       | Add loading states                  | P3        | 1         |
| VALID-2      | Remove mock data fallbacks          | P3        | 1         |
| VALID-3      | Add composite DB indexes            | P3        | 1         |
| VALID-4      | Add pagination to list endpoints    | P3        | 2         |
| VALID-5      | Validate GET query params           | P3        | 2         |
| PROFILE-4    | Activity timeline API + UI          | P3        | 2         |
| PROFILE-5    | Account deletion flow               | P3        | 2         |
| ONBOARD-1    | Handle onboarding race condition    | P3        | 1         |
| MEMORY-3     | Map visibility gating               | P3        | 2         |
| MEMORY-4     | Profile ring indicator              | P3        | 1         |
| INFRA-1      | Configure connection pooling        | P3        | 1         |
| INFRA-2      | Add health check endpoint           | P3        | 1         |
| INFRA-3      | Integrate error tracking            | P3        | 2         |
| INFRA-4      | Schedule invitation cleanup         | P3        | 1         |
| INFRA-5      | Ensure production env vars          | P3        | 1         |
| A11Y-1       | Fix modal accessibility             | P3        | 2         |
| A11Y-2       | Map keyboard navigation             | P3        | 2         |
| MOBILE-1     | Responsive map layout               | P3        | 3         |
| GROUP-4      | Relax group name uniqueness         | P3        | 1         |
|              | **P3 Subtotal**                     |           | **31**    |
|              |                                     |           |           |
| NICE-1       | Activate dark mode                  | Post-Beta | 1         |
| NICE-2       | Wire notification system            | Post-Beta | 3         |
| NICE-3       | Batch timeline visualization        | Post-Beta | 3         |
| NICE-4       | Multi-image memory carousel         | Post-Beta | 3         |
| NICE-5       | Social sharing OG images            | Post-Beta | 2         |
| NICE-6       | Leaderboard + contribution stats    | Post-Beta | 3         |
| NICE-7       | Analytics dashboard (admin)         | Post-Beta | 3         |
| NICE-8       | Export batch archives as PDF        | Post-Beta | 3         |
| NICE-9       | AI-powered auto-captioning          | Post-Beta | 3         |
| NICE-10      | Multi-university architecture       | Post-Beta | 3         |
|              | **Nice-to-Have Subtotal**           |           | **27**    |
|              |                                     |           |           |
|              | **Grand Total**                     |           | **144**   |
