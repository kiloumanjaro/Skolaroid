# Skolaroid — Pre-Beta Audit Report

> Generated: April 2, 2026
> Scope: Full codebase traversal — Pass 1 (Technical) + Pass 2 (Logic & Loopholes)

---

## Feature Implementation Status

| #   | Feature                            | Status      | Completion % |
| --- | ---------------------------------- | ----------- | ------------ |
| 1   | User Profiles & Accounts           | PARTIAL     | 40%          |
| 2   | Batch Archives & Story Highlights  | PARTIAL     | 20%          |
| 3   | Immersive Mapping                  | PARTIAL     | 65%          |
| 4   | Batch Heatmap Overlay              | NOT STARTED | 5%           |
| 5   | Advanced Search                    | NOT STARTED | 5%           |
| 6   | Groups & Communities               | PARTIAL     | 70%          |
| 7   | Fundraising Platform               | NOT STARTED | 0%           |
| 8   | "On This Day" Digital Time Capsule | NOT STARTED | 0%           |
| 9   | Input a Story                      | PARTIAL     | 45%          |

---

## Critical Gaps — Must Fix Before Beta

---

### 1. User Profiles & Accounts

#### Existing Code

- **Prisma model**: `User` in `prisma/schema.prisma` — id, studentId, email, firstName, lastName, status, role, programBatchId
- **API routes**: `src/app/api/prisma/user/get-current/route.ts`, `create/route.ts`, `get-all/route.ts`, `delete/route.ts`, `delete-many/route.ts`, `create-many/route.ts`
- **Hooks**: `src/lib/hooks/useCurrentUser.ts`, `src/lib/hooks/useUserAuth.ts`, `src/lib/hooks/useUsers.ts`, `src/lib/hooks/useOnboardUser.ts`
- **Components**: `src/components/sign-up-form.tsx`, `src/components/login-form.tsx`, `src/components/onboarding/*`, `src/components/profile/*`
- **Auth flow**: Google OAuth via Supabase → `src/app/auth/callback/route.ts` → proxy enforces onboarding → `src/app/onboarding/page.tsx` → `src/app/api/prisma/user/create`
- **Proxy**: `src/proxy.ts` enforces authentication + onboarding guards

#### Missing Code

- [ ] **Email domain restriction** — `src/lib/schemas.ts` `signUpSchema` accepts any email; no server-side domain check in `src/app/api/prisma/user/create/route.ts`. Add Zod `.refine()` validating `@up.edu.ph`, `@upcebu.edu.ph`, `@alumni.up.edu.ph` domains to both `signUpSchema` and `onboardUserSchema`, plus server-side enforcement in the user creation route
- [ ] **Profile `bio` field** — `User` model in `prisma/schema.prisma` has no `bio` column; `src/components/profile/ProfileBioCard.tsx` displays a static placeholder. Add `bio String?` to schema + migration
- [ ] **Profile `contactInfo` field** — No phone, LinkedIn, Facebook, or other contact fields in `User` model; `src/components/profile/ProfileContactCard.tsx` is display-only. Add a `contactInfo Json?` or individual fields to schema
- [ ] **Profile `avatarUrl` field** — No persistent avatar URL on `User` model; currently reads from Supabase `user_metadata` only. Add `avatarUrl String?` to allow custom photo uploads
- [ ] **Profile edit API route** — No `src/app/api/prisma/user/update/route.ts` exists. Create PATCH endpoint for updating bio, contact, avatar
- [ ] **Profile edit UI** — `src/components/profile/ProfileHero.tsx` has a disabled "Edit Profile" button; no edit modal or form component exists
- [ ] **Profile edit hook** — No `useUpdateProfile` hook exists under `src/lib/hooks/`
- [ ] **Activity timeline component** — `src/components/profile/ProfileActivityCard.tsx` exists but has no real data source; needs API route to aggregate user activity (memories posted, votes, comments)
- [ ] **Password change** — `src/components/profile/ProfileSettingsCard.tsx` shows "Change Password" button as disabled/"not available yet"; no route or UI for Supabase password update
- [ ] **Account deletion** — same settings card has disabled "Delete Account"; no route or cleanup logic

#### Logic & Security Loopholes

- [ ] **Any Google account can register** — enforce email domain restriction in Supabase Auth settings (allowed email domains/patterns) AND in the user creation route; currently a Gmail or Outlook account gets full access
- [ ] **`/api/prisma/user/get-all` has no auth guard** — anyone can enumerate all users; add authentication check + admin role verification
- [ ] **`/api/prisma/user/delete` has no auth guard** — anyone who can call the endpoint can delete any user by UUID; add admin-only authentication
- [ ] **`/api/prisma/user/delete-many` has no auth guard** — can atomically delete ALL users; add admin-only authentication or remove entirely
- [ ] **`/api/prisma/user/create-many` has no auth guard** — can bulk-insert users; add admin-only authentication
- [ ] **No email verification step** — Google OAuth handles identity but email-password signups (if enabled) have no confirmation step
- [ ] **Race condition on onboarding** — concurrent requests during the onboarding flow could create duplicate `User` rows if Prisma `upsert` isn't used; schema has `email UNIQUE` but error handling for violates should be explicit

---

### 2. Batch Archives & Story Highlights

#### Existing Code

- **Prisma models**: `Batch`, `Program`, `ProgramBatch` in `prisma/schema.prisma`; `Memory` model linked to `ProgramBatch`
- **Components**: `src/components/batch-card.tsx` (animated year card), `src/components/batch-sidebar.tsx` (era drawer), `src/components/batches-modal.tsx` (searchable memories grid)
- **Gallery**: `src/app/gallery/page.tsx`, `src/components/gallery/GalleryMemoryCard.tsx`, `GalleryPolaroid.tsx`, `PolaroidCluster.tsx`, layouts (`Single/Dual/Triple/QuadPhoto.tsx`)
- **Hooks**: `src/lib/hooks/useAllMemoriesWithCoordinates.ts` provides batch-filtered memories

#### Missing Code

- [ ] **Dedicated batch archive page** — No `src/app/batches/[batchId]/page.tsx` or `src/app/batches/page.tsx` exists; batch exploration only happens via the sidebar and era-based gallery filtering
- [ ] **Story model** — No `Story` model in Prisma schema; `src/components/add-memory-modal.tsx` has an `addToStory: boolean` state field that is never sent to the API
- [ ] **Story API routes** — No `src/app/api/prisma/story/` directory exists
- [ ] **Story display components** — No Instagram-style story viewer/carousel component exists
- [ ] **Story highlights per batch** — No aggregation endpoint or UI section on batch pages to show story highlights
- [ ] **Content approval model** — `Memory` model has no `approvalStatus` field (e.g., `PENDING`, `APPROVED`, `REJECTED`); brief states "All submitted content undergoes an approval process"
- [ ] **Content approval API routes** — No moderation queue endpoints exist; admin page at `src/app/admin/page.tsx` is entirely mock data
- [ ] **Content approval workflow** — No moderator notification, approval action, or rejection-with-reason flow
- [ ] **Batch archive browser API** — No endpoint to list all batches with summary stats (member count, memory count, active stories)
- [ ] **Document/news upload support** — `src/app/api/storage/upload-memory-media/route.ts` only accepts `image/*` and `video/*` MIME types; no PDF or document support as mentioned in brief

#### Logic & Security Loopholes

- [ ] **Content is published immediately without review** — any authenticated user can post memories visible to all; add `approvalStatus` field with `PENDING` default and only show `APPROVED` content publicly
- [ ] **No batch membership validation** — a user from batch 2020 can post memories attributed to batch 2015's `programBatchId` because the create memory route doesn't verify the user's own `programBatchId` matches
- [ ] **Mock data fallback in batches-modal** — `src/components/batches-modal.tsx` falls back to `MOCK_MEMORIES` when real data is unavailable, which could show placeholder content to real users

---

### 3. Immersive Mapping

#### Existing Code

- **Prisma model**: `Location` in `prisma/schema.prisma` — buildingName, latitude, longitude, description; unique constraint on `[lat, lng]`
- **API routes**: `src/app/api/prisma/location/get-all/route.ts`, `create-custom/route.ts`, `src/app/api/prisma/memory/counts-by-landmark/route.ts`, `get-all-with-coordinates/route.ts`, `get-by-location/route.ts`
- **Components**: `src/components/map.tsx` (Mapbox GL integration with era styling, landmark markers, memory pins), `src/components/map/ActionBar.tsx`, `CommentSection.tsx`, `FilterMemoriesModal.tsx`, `MemoryDetailModal.tsx`, `MemoryPin.tsx`, `MemoryPinStack.tsx`, `MapLocationSelector.tsx`, `LandmarkMarker.tsx`, `LandmarkMarkers.tsx`, `LandmarkMemoriesPanel.tsx`, `DeleteMemoryModal.tsx`
- **Hooks**: `src/lib/hooks/useLocations.ts`, `useCreateCustomLocation.ts`, `useAllMemoriesWithCoordinates.ts`, `useMemoriesByLocation.ts`, `useMemoryCountsByLandmark.ts`
- **Constants**: `src/lib/constants/landmarks.ts` — 20+ UP Cebu buildings with real GPS coordinates
- **Page**: `src/app/map/page.tsx`

#### Missing Code

- [ ] **Location categorization** — `Location` model has no `category` field for academic vs. non-academic classification; brief requires "Locations can be categorized into: Academic-related activities / Non-academic-related activities"
- [ ] **Batch-linked location association** — No explicit `batch → location` relationship; memories link locations to batches indirectly, but there's no "places this batch has been" aggregation endpoint
- [ ] **Off-campus locations** — LANDMARKS constant is campus-only; brief says "Not limited to the school vicinity"; custom locations support exists via `create-custom` but no UI for exploring off-campus locations on the map

#### Logic & Security Loopholes

- [ ] **GPS coordinate spoofing** — `create-custom` route accepts any lat/lng pair without validation bounds; add reasonable geographic bounding box validation to prevent obviously wrong coordinates (e.g., ocean, different country)
- [ ] **10m deduplication radius may be too aggressive** — `create-custom` reuses existing locations within 10m using the Haversine formula; user might want distinct locations inside a single building
- [ ] **Mapbox token exposed client-side** — `NEXT_PUBLIC_MAPBOX_TOKEN` is by design public, but ensure Mapbox dashboard has URL-based key restrictions to prevent token theft
- [ ] **Heavy map queries at scale** — `get-all-with-coordinates` fetches ALL accessible memories at once; with thousands of memories this will be slow; need pagination or viewport-based fetching (bounding box query)

---

### 4. Batch Heatmap Overlay

#### Existing Code

- **API route**: `src/app/api/prisma/memory/counts-by-landmark/route.ts` — groups memories by `locationId` and counts them; can serve as a heatmap data source
- **Hook**: `src/lib/hooks/useMemoryCountsByLandmark.ts`

#### Missing Code

- [ ] **Heatmap Mapbox layer** — No Mapbox GL `heatmap` layer configuration in `src/components/map.tsx`; the map only renders discrete pins and markers
- [ ] **Heatmap data endpoint per batch** — `counts-by-landmark` doesn't filter by `programBatchId`; need a batch-scoped version
- [ ] **Heatmap toggle UI** — No button/control to toggle between pin view and heatmap overlay on the map
- [ ] **Heatmap legend** — No color scale legend component showing what density values the colors represent
- [ ] **Campus boundary overlay** — No campus polygon definition for bounding the heatmap to the campus footprint

#### Logic & Security Loopholes

- [ ] **Heatmap based on all-time data** — need filtering by date range and batch to make the overlay meaningful per the brief ("which parts of the university were most vibrant for each batch")

---

### 5. Advanced Search

#### Existing Code

- **Client-side only**: In-memory search in `src/components/batches-modal.tsx` and `src/components/add-memory-modal.tsx` filtering by title/description/tags against local data

#### Missing Code

- [ ] **Search API route** — No `src/app/api/prisma/search/route.ts` exists; need full-text search endpoint spanning Users, Memories, Tags, Locations, Batches
- [ ] **Search Zod schema** — No search query validation schema in `src/lib/schemas.ts`
- [ ] **Search results page** — No `src/app/search/page.tsx` exists
- [ ] **Search UI component** — No global search bar component; header (`src/components/header.tsx`) has no search input
- [ ] **Search hook** — No `useSearch` hook in `src/lib/hooks/`
- [ ] **Chronological results ordering** — Brief specifies results organized in chronological batch order
- [ ] **PostgreSQL full-text search or `pg_trgm` index** — No Prisma migration creates `tsvector` or trigram indexes for performant search

#### Logic & Security Loopholes

- [ ] **Search result visibility leakage** — when implemented, search must respect `MemoryVisibility` rules (private/group-only memories should not appear in search results for unauthorized users)

---

### 6. Groups & Communities

#### Existing Code

- **Prisma models**: `PrivateGroup` (name, description, creatorId, members, invitations, memories), `Invitation` (groupId, invitedBy, email, token, expiresAt) in `prisma/schema.prisma`
- **API routes**: `src/app/api/prisma/group/create/route.ts`, `list/route.ts`, `[groupId]/route.ts`, `[groupId]/delete/route.ts`, `[groupId]/members/route.ts`; `src/app/api/prisma/invitation/send/route.ts`, `validate/route.ts`, `accept/route.ts`, `decline/route.ts`, `cleanup/route.ts`
- **Components**: `src/components/groups/CreateGroupModal.tsx`, `DeleteGroupModal.tsx`, `GroupPanel.tsx`, `GroupSwitcher.tsx`, `GroupToast.tsx`, `InviteMembersModal.tsx`, `LeaveGroupModal.tsx`, `RemoveMemberDialog.tsx`, `ShareGroupModal.tsx`; `src/components/groups/tabs/MembersTab.tsx`, `MediaTab.tsx`, `AboutTab.tsx`
- **Hooks**: `src/lib/hooks/useCreateGroup.ts`, `useUserGroups.ts`, `useGroupById.ts`, `useGroupMembers.ts`, `useGroupMemories.ts`, `useDeleteGroup.ts`, `useInvitation.ts`
- **Pages**: `src/app/groups/[groupId]/page.tsx` (redirects to `/map`), `src/app/invite/page.tsx`
- **Email**: `src/lib/email.ts` — Resend-based invitation email with accept link

#### Missing Code

- [ ] **Group edit/update API route** — No `PATCH /api/prisma/group/[groupId]/update` route exists; `updateGroupServerSchema` is defined in `src/lib/schemas.ts` but unused
- [ ] **Group edit UI** — No edit modal for changing group name or description after creation
- [ ] **Organization-level archives** — Groups are currently `PrivateGroup` (private-only); brief mentions public org archives "with same structure as batch archives"; the current model has no `isPublic` or `GroupType` enum
- [ ] **Group-level story highlights** — No story/highlight feature per group
- [ ] **Groups listing page** — No `src/app/groups/page.tsx` independent listing; groups are accessed via the panel/switcher within the map view

#### Logic & Security Loopholes

- [ ] **Group name uniqueness is global** — `PrivateGroup.name` is `@unique` in schema; two unrelated groups can't share a name, which is overly restrictive at scale
- [ ] **No member limit per group** — uncapped membership could cause performance issues when loading group details with all members included
- [ ] **Invitation token is predictable-length** — tokens use `crypto.randomBytes(32).toString('hex')` (64 hex chars) which is secure, but invitation cleanup endpoint (`/api/prisma/invitation/cleanup/route.ts`) has no scheduled trigger; expired tokens remain until manually cleaned

---

### 7. Fundraising Platform

#### Existing Code

- **None** — zero fundraising-related code exists anywhere in the codebase

#### Missing Code

- [ ] **Fundraising Prisma model** — Create `Fundraiser` model with fields: title, description, targetAmount, currentAmount, creatorId, status (PENDING/APPROVED/ACTIVE/COMPLETED/REJECTED), startDate, endDate, proofDocuments
- [ ] **Fundraiser API routes** — Create `src/app/api/prisma/fundraiser/` with create, list, get, approve, reject, update, delete endpoints
- [ ] **Fundraiser Zod schemas** — Add `createFundraiserSchema`, `updateFundraiserSchema`, `approveFundraiserSchema` to `src/lib/schemas.ts`
- [ ] **Fundraiser hooks** — Create `useCreateFundraiser`, `useFundraisers`, `useFundraiserById`, `useApproveFundraiser` hooks
- [ ] **Fundraiser page** — Create `src/app/fundraising/page.tsx` for public listings + `src/app/fundraising/[id]/page.tsx` for detail
- [ ] **Fundraiser components** — Create `FundraiserCard`, `CreateFundraiserModal`, `FundraiserDetailView`, `FundraiserApprovalPanel`
- [ ] **Application/approval process** — Admin review workflow for fundraising projects before they go public
- [ ] **Admin fundraiser management** — Wire into admin page for approval queue

#### Logic & Security Loopholes

- [ ] **Fraud vector** — fundraising feature requires strict identity verification, proof-of-cause documentation, and potentially escrow integration; without these, fake campaigns can easily be created
- [ ] **Financial accountability** — the brief mentions "ensuring trustworthiness"; there's no mechanism for tracking fund disbursement or reporting
- [ ] **Stale campaigns** — need automatic expiration of campaigns that don't reach their goal by end date

---

### 8. "On This Day" Digital Time Capsule

#### Existing Code

- **None** — only a conceptual mention in admin page mock data text

#### Missing Code

- [ ] **"On This Day" API route** — Create `src/app/api/prisma/memory/on-this-day/route.ts` that queries memories where `memoryDate` matches today's month+day across all years
- [ ] **"On This Day" hook** — Create `useOnThisDay` hook in `src/lib/hooks/`
- [ ] **"On This Day" component** — Create `OnThisDayCarousel` or similar component for the home page
- [ ] **Home page integration** — `src/app/page.tsx` currently shows animated batch cards; after login, it should prominently feature the "On This Day" capsule
- [ ] **Date field coverage** — `Memory.memoryDate` is optional (`DateTime?`); many memories may not have a date set, reducing the feature's effectiveness. Consider requiring `memoryDate` for new memories or prompting users to add dates

#### Logic & Security Loopholes

- [ ] **Empty-state problem** — in early days there won't be memories for most dates; need a graceful fallback (e.g., "No memories on this day yet — be the first!")
- [ ] **Visibility filtered** — "On This Day" queries must respect `MemoryVisibility` rules; private or group-only memories should not appear in the public capsule
- [ ] **Time zone ambiguity** — `memoryDate` and "today" must agree on timezone; server UTC vs. Philippines time (UTC+8) will cause off-by-one-day mismatches

---

### 9. Input a Story (Memory Posting)

#### Existing Code

- **Prisma model**: `Memory` with title, description, mediaURL, memoryDate, visibility, tags, votes, comments, location, programBatch, creator
- **API routes**: `src/app/api/prisma/memory/create/route.ts`, `get-by-creator/route.ts`, `get-by-location/route.ts`, `get-by-group/route.ts`, `get-all-with-coordinates/route.ts`, `[memoryId]/delete/route.ts`, `update-tags/route.ts`, `vote/toggle/route.ts`, `vote/status/route.ts`, `comment/create/route.ts`, `comment/get/route.ts`, `comment/[commentId]/delete/route.ts`
- **Storage**: `src/app/api/storage/upload-memory-media/route.ts` — Supabase file upload (10MB, image/video)
- **Components**: `src/components/add-memory-modal.tsx` (multi-tab: upload, location, caption, privacy), `memory-card.tsx`, `memory-list.tsx`, `src/components/map/MemoryDetailModal.tsx`, `ActionBar.tsx`, `CommentSection.tsx`
- **Services**: `src/services/create-memory-service.ts` (auto-tagging), `get-comments-service.ts`, `toggle-vote-service.ts`
- **Hooks**: `src/lib/hooks/useCreateMemory.ts`, `useDeleteMemory.ts`, `useToggleVote.ts`, `useVoteStatus.ts`, `useCreateComment.ts`, `useCommentsByMemory.ts`, `useDeleteComment.ts`, `useUpdateMemoryTags.ts`

#### Missing Code

- [ ] **Map visibility gating** — Brief states users without stories are not shown on the map: "Oh no, you haven't inputted a memory yet! You are not shown on the map." No logic in `src/components/map.tsx` or the map data endpoint implements this check
- [ ] **Profile ring indicator** — Brief specifies "Instagram-like ring border around profile picture" for users with stories; no conditional ring styling in `src/components/profile/ProfileHero.tsx` or `src/components/account-menu.tsx`
- [ ] **Memory edit API route** — No `PATCH /api/prisma/memory/[memoryId]/update` route; users cannot edit memories after posting (only delete or edit tags)
- [ ] **Memory edit UI** — No edit form/modal for changing title, description, visibility, or media after creation
- [ ] **Memory restore from soft-delete** — `Memory.deletedAt` enables soft-delete but no restore/undo endpoint exists
- [ ] **Hardcoded programBatchId** — `src/components/add-memory-modal.tsx` uses `MOCK_PROGRAM_BATCH_ID = '50000000-...'` instead of reading from the authenticated user's actual `programBatchId`
- [ ] **Upload check bypassed** — `src/components/add-memory-modal.tsx` TODO comments indicate upload validation is temporarily disabled (`"TODO: re-enable upload check once backend is wired up"`)

#### Logic & Security Loopholes

- [ ] **No file content validation** — `src/app/api/storage/upload-memory-media/route.ts` checks MIME type prefix but not actual file content (magic bytes); a malicious file with a spoofed MIME type could be uploaded
- [ ] **Upload has no auth guard** — the upload route creates a Supabase client with the service role key but doesn't verify the request came from an authenticated user; any caller can upload files
- [ ] **10MB per file with no per-user rate limit** — no throttling on how many files a user can upload; abuse vector for storage exhaustion
- [ ] **Dev-mode seed-user fallback** — `src/app/api/prisma/memory/vote/toggle/route.ts` and `comment/create/route.ts` fall back to a hardcoded seed user UUID when auth fails in development; if `NODE_ENV` misconfiguration occurs in production, unauthenticated users could vote/comment as the seed user
- [ ] **Optimistic UI desync risk** — vote toggle uses client+server 2-second debounce independently; if timing drifts, the UI may show a vote state that doesn't match the server

---

## Cross-Cutting Technical Gaps

### Authentication & Authorization

- [ ] **No role-based route protection** — `UserRole` enum (`USER`, `ADMIN`) exists in schema but no API route checks `role === 'ADMIN'`; the admin page has no backend enforcement
- [ ] **Admin page accessible to all authenticated users** — `src/app/admin/page.tsx` has no auth guard; any logged-in user can see the admin dashboard (currently mock data, but will be a problem once real data is wired)
- [ ] **No CSRF protection** — API routes accept POST/DELETE requests without CSRF token verification; while Supabase session cookies provide some protection, explicit CSRF guards should be added for state-changing operations
- [ ] **API routes beyond proxy scope** — `src/proxy.ts` matcher may not cover all API routes explicitly; verify all `/api/prisma/*` routes require authenticated sessions

### Error Handling

- [ ] **No `error.tsx` boundary anywhere** — none of the route segments (`src/app/`, `src/app/map/`, `src/app/gallery/`, etc.) have Next.js error boundaries; unhandled exceptions will show the default white error screen
- [ ] **No `not-found.tsx`** — no custom 404 page; users hitting invalid URLs see the default Next.js 404
- [ ] **No `loading.tsx`** — no Next.js streaming loading states for route transitions; pages either show nothing or custom skeletons (where implemented)
- [ ] **No `global-error.tsx`** — root layout errors are completely unhandled

### Input Validation

- [ ] **Inconsistent validation** — most POST routes validate with Zod, but some GET routes don't validate query parameters (e.g., `get-all` routes accept unvalidated query strings)
- [ ] **No input sanitization** — text fields (memory title, description, comments, group name) are stored as-is; while React escapes output by default, raw data in the DB could be problematic for non-React consumers (email templates, exports)

### Database & Performance

- [ ] **No Supabase RLS policies** — all database access goes through server-side Prisma routes; if the Supabase client is ever used directly (or a direct DB connection is exposed), there are zero row-level security policies protecting the data
- [ ] **No database connection pooling configuration** — `src/lib/prisma.ts` uses a `pg Pool` but connection limits, idle timeout, and max connections are not explicitly configured for production
- [ ] **Missing composite indexes** — several common query patterns lack composite indexes: (1) `Memory` filtered by `programBatchId + visibility + deletedAt`, (2) `MemoryComment` filtered by `memoryId + deletedAt + createdAt`
- [ ] **No pagination on user/location listing** — `GET /api/prisma/user/get-all` and `GET /api/prisma/location/get-all` return all rows with no limit; will be slow at scale
- [ ] **`src/database/` directory is empty** — appears to be intended for a service/repository layer that was never built

### Security Headers

- [ ] **No security headers in `next.config.ts`** — missing `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
- [ ] **No rate limiting on API routes** — only the vote toggle has an in-process rate limiter; all other routes (login, signup, memory creation, comment posting) are unbounded

### Monitoring & Observability

- [ ] **No error tracking** — no Sentry, LogRocket, or similar service integrated; server errors are `console.error` only
- [ ] **No analytics** — no Vercel Analytics, PostHog, or similar usage tracking
- [ ] **No health check endpoint** — no `/api/health` route for uptime monitoring

### Accessibility

- [ ] **Inconsistent `aria-*` attributes** — some interactive elements lack `aria-label` or `aria-expanded` (especially in complex modals like `MemoryDetailModal`, `GroupPanel`)
- [ ] **Focus management in modals** — Radix UI Dialog handles focus trapping, but custom modals/drawers (batch sidebar, memory detail flip animation) may not trap focus correctly
- [ ] **Color contrast** — hand-drawn theme with custom colors (`skolaroid-blue`) may not meet WCAG AA contrast ratios on all backgrounds
- [ ] **Keyboard navigation** — map pins and landmark markers are not keyboard accessible; Mapbox GL requires custom keyboard handlers

### Mobile UX

- [ ] **Map not optimized for mobile** — full-screen Mapbox with complex overlays, pin stacks, and modals may be difficult to use on small screens
- [ ] **Memory detail modal** — book-style flip animation may not work well on narrow viewports
- [ ] **Gallery fixed-width polaroid layouts** — `SinglePhoto` is 380x560px; may overflow on mobile screens

### Environment & Deployment

- [ ] **`RESEND_API_KEY` and `RESEND_FROM_EMAIL` needed** — invitation emails require Resend configuration; undefined in production will silently fail
- [ ] **`CRON_SECRET` needed** — invitation cleanup endpoint requires a secret for authorization; no Vercel Cron Job is configured to call it
- [ ] **Image optimization disabled in dev** — `next.config.ts` sets `images.unoptimized: isDev`; ensure this is `false` in production (it is, by config)

---

## Nice-to-Have Features (Post-Beta / Investor Demo)

> These are not required for beta but would strengthen the product and improve investor appeal.

### Experience Enhancements

- [ ] **Dark mode** — `next-themes` is already a dependency but not activated; add theme toggle with campus-themed dark palette
- [ ] **Notification system** — `src/components/notifications-menu.tsx` exists with mock data; wire to real WebSocket/SSE or polling-based notification backend (new comments, votes, group invites)
- [ ] **Memory edit-in-place** — allow editing title, description, and visibility without deleting and re-creating
- [ ] **Batch timeline view** — chronological timeline visualization per batch showing key events, milestones, and memories
- [ ] **Media carousel in memory detail** — support multi-image memories with swipeable gallery
- [ ] **Offline-friendly PWA** — service worker for caching map tiles and recently viewed memories
- [ ] **Drag-and-drop memory ordering** — allow batch moderators to curate the order of memories on archive pages

### Growth & Engagement Features

- [ ] **Push notifications** — web push for new activity on memories, group activity, and "On This Day" reminders
- [ ] **Social sharing** — `src/app/preview-memory-card/` directory exists; expand to generate Open Graph images for memory cards shared on social media
- [ ] **Leaderboard / contribution stats** — gamify contributions with top contributors per batch, most-voted memories, etc.
- [ ] **Batch comparison view** — side-by-side activity/memory comparison between two batches
- [ ] **Tagging users in memories** — `@mention` system to tag classmates in shared memories
- [ ] **Comment reactions** — lightweight emoji reactions on comments (beyond the vote system)
- [ ] **Email digest** — weekly summary of new memories, popular posts, and upcoming events sent via Resend

### Investor-Facing Differentiators

- [ ] **Analytics dashboard** — platform-wide metrics: total memories, active users, most-photographed locations, batch engagement rates; demonstrates traction
- [ ] **AI-powered auto-captioning** — use Vision API to suggest memory descriptions from uploaded photos; demonstrates technical sophistication
- [ ] **Multi-university expansion architecture** — abstract the `University` as a top-level entity in the schema so the platform can scale beyond UP Cebu; demonstrates market expansion potential
- [ ] **Content moderation ML pipeline** — automated flagging of inappropriate uploads using image classification; demonstrates trust & safety commitment
- [ ] **Export & data portability** — allow alumni associations to export batch archives as PDF yearbooks or ZIP archives; demonstrates institutional value
- [ ] **SSO integration with UP systems** — if UP has an institutional SSO (e.g., CAS, SAML), integrating it eliminates friction and demonstrates institutional buy-in
- [ ] **Real-time collaboration** — multiple users co-editing a batch archive page simultaneously; demonstrates ambition akin to Notion/Google Docs for memories

---

## Summary Checklist

- [ ] All User model gaps closed (bio, contact, avatar, edit API, email domain restriction)
- [ ] Content approval workflow implemented (schema + API + admin UI)
- [ ] Story highlights feature built (model, API, display, per-batch aggregation)
- [ ] Batch heatmap overlay added to map (Mapbox heatmap layer, batch filter, toggle)
- [ ] Advanced search implemented (API, UI, full-text indexing)
- [ ] Fundraising platform scaffolded (model, API, UI, approval flow)
- [ ] "On This Day" capsule built (API, home page component, timezone handling)
- [ ] Map visibility gating enforced (no-story users hidden, prompt to contribute)
- [ ] Profile ring indicator for active storytellers
- [ ] Auth guards added to all admin/destructive API routes
- [ ] Error boundaries added (`error.tsx`, `not-found.tsx`, `global-error.tsx`)
- [ ] Security headers configured in `next.config.ts`
- [ ] Rate limiting strategy implemented beyond vote toggle
- [ ] Remove hardcoded mock programBatchId from `add-memory-modal.tsx`
- [ ] Re-enable upload validation checks in `add-memory-modal.tsx`
- [ ] Add auth guard to upload endpoint
- [ ] Remove/protect dev-mode seed-user fallbacks in production
- [ ] All critical gaps resolved
- [ ] All loopholes patched
- [ ] Beta launch approved
