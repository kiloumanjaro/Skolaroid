# Skolaroid AI Guide

These notes are for AI coding assistants working on the Skolaroid codebase. Read the entire file before editing code so you understand the architecture, data flow, and project-specific patterns.

## 🏗️ Big Picture

- **Framework**: Next.js 16.1+ App Router (see `src/app`). Uses server components by default; add a `"use client"` directive at top of files that run in the browser.
- **Backend**: Prisma v7 with a PostgreSQL database (hosted on Supabase). The client is created in `src/lib/prisma.ts` using `@prisma/adapter-pg` and a `pg` `Pool`. Global caching of the client only happens in development.
- **Data flow**: UI components → custom hooks (`src/lib/hooks/*`) → fetch `/api/prisma/...` endpoints. **Never** call API route handlers (`fetch('/api/...')`) from inside Server Components. Instead, extract shared logic into `src/services/` or `src/lib/` and call it directly on the server.
- **State & caching**: React Query (`@tanstack/react-query`) is wrapped in `<QueryProvider>` (`src/providers/query-provider.tsx`) with sane defaults. Use Server Actions or API routes combined with Next.js cache APIs (`revalidatePath` / `revalidateTag`) to invalidate stale data after mutations.
- **Validation**: Zod schemas live in `src/lib/schemas.ts`; the same schemas are used on the client for forms and on the server for request validation. Schema names end with `Schema` and exports types for convenience.
- **UI**: Tailwind CSS, Radix UI components, and a small `components/ui` library of primitives. Helper `cn()` (in `src/lib/utils.ts`) merges/cleans class names via `clsx` + `tailwind-merge`.

## 📁 Key directories

```
src/
  app/            # Next pages/layouts + server/api routes
  components/     # Page-specific & shared UI components
    ui/           # Reusable atomic UI primitives
  lib/            # Utilities, schemas, prisma client, slugify
    hooks/        # React Query hooks that call API routes
    supabase/     # browser/server clients + proxy middleware
  providers/      # React context providers
  styles/         # global CSS (Tailwind)
```

`prisma/` contains the schema and migration history; `generated/` holds Prisma's TS output (do not edit manually).

## 🚦 API route & Component conventions

- All routes under `src/app/api/prisma/*/route.ts`. They export `GET`, `POST`, etc. functions that return `NextResponse.json(...)`.
- **Async request APIs in Next.js 16**: APIs that access request-bound data (like `cookies()`, `headers()`) and configuration props like `params` or `searchParams` **are asynchronous**. They must be `await`ed before accessing their sub-keys inside of Server Components and Route Handlers.
- Error structure: successful responses `{ success: true, ... }`; errors either `{ error: message }` or `{ success: false, message }` with appropriate status codes (`200` for ok, `400` for validation, `401` missing auth, `500` for exceptions).
- Validation: use the corresponding Zod schema's `safeParse`. If validation fails return `400` with the first issue message (`parsed.error.issues[0].message`).
- Avoid extracting server rendering logic into endpoints. API routes should largely remain client-interaction endpoints.

## 🔄 Client patterns

- Custom hooks wrap fetch calls to API routes. Example: `useMemoriesByLocation` constructs a query key and encodes parameters.
- Forms use Zod for client validation; errors are rendered with `<FormError>` components in `components/ui`.
- `useUserAuth` hook provides client-side auth state (`isAuthenticated`, `user`, `loading`, `logout`). Onboarding is enforced server-side via the proxy, not via localStorage.
- `@/` TypeScript path alias points to `src/*` as configured in `tsconfig.json`.
- When adding a new component that will run in the browser, remember to add `'use client'` at the top and import React hooks accordingly.

## 🔐 Supabase & auth

- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` (client), `SUPABASE_SERVICE_ROLE_KEY` (admin operations only), and `DATABASE_URL`/`DIRECT_URL` (Prisma).
- Browser client created by `createBrowserClient` in `src/lib/supabase/client.ts`; server client in `.../server.ts` must be created per request (important for Fluid compute).
- `src/lib/supabase/proxy.ts` handles **session refresh and cookie sync only**. It exports `refreshSession()` which returns the user claims and a response with synced cookies.
- `src/proxy.ts` is the **Next.js proxy entry point** (replaces the old `middleware.ts`). It imports `refreshSession()` from `src/lib/supabase/proxy.ts` and composes it with app-level guards (authentication + onboarding enforcement).
- Onboarding status is stored in `app_metadata.onboarded` (set via the Supabase Admin API with the service role key in the onboard API route). The proxy reads this flag to enforce onboarding.
- After OAuth login, users are redirected to `/`. The proxy intercepts the request and redirects to `/onboarding` if the user is not yet onboarded.
- There is no `/auth/callback` route. Redirection logic is fully handled by the proxy.
- `user_metadata` is user-writable and used for non-sensitive profile data. `app_metadata` is server-only writable (via `SUPABASE_SERVICE_ROLE_KEY`) and used for security-critical flags like `onboarded`.
- Do **not** mutate the response object returned from `createServerClient` without copying cookies as described in comments.

## 🔧 Development workflows

- Install dependencies: `pnpm install` (workspace uses pnpm).
- Local dev server: `pnpm dev` → `next dev --turbo`.
- Build: `pnpm build`; start: `pnpm start`.
- Type checking: `pnpm type-check`.
- Lint/format: `pnpm lint`, `pnpm format`.
- Prisma migrations:
  - `npx prisma migrate dev` (for local db; uses `.env`).
  - `pnpm migrate:prod` / `pnpm migrate:resolve` for production (these use `dotenv-cli` with `.env.production`).
  - Seed via `npx prisma db seed` (shell script defined in `package.json`).
- Environment files are not checked in; copy from your cloud provider or ask the maintainer for a template.
- Commit messages must follow Conventional Commits; husky + lint-staged are configured. `pnpm prepare` sets up Husky hooks.

## 🚨 Project-specific conventions

- **Tailwind theme**: custom colors including `skolaroid-blue`; update `tailwind.config.ts`.
- **Map component**: uses Mapbox GL; requires `NEXT_PUBLIC_MAPBOX_TOKEN`. A temporary image source is configured; update it when real map data is available.
- **Media URLs**: currently placeholders; when implementing uploads store files in Supabase storage and update `next.config.ts` `images.remotePatterns` accordingly.
- **Naming**: use `*Schema` for Zod objects and `*Input` for inferred types. Keep `Server` suffix on schemas used in API routes to distinguish from client-only versions.
- **Constants**: several memory-related limits (`MAX_TAGS`, `MAX_TAG_SUGGESTIONS`) live in `schemas.ts`.

## 🔄 External integrations

- **Supabase** for auth and eventually file storage. Only the client is lightly used at the moment; authentication flows live under `src/auth/*` and `src/components`.
- **Mapbox** for the interactive building map (`src/components/map.tsx`). Requires a token in env.
- **Prisma**: the `datasource` uses `DIRECT_URL` in `prisma.config.ts`; migrations live in `prisma/migrations/*`.
- **pg** and `@prisma/adapter-pg`: database connections use a pooled `Pool` object defined in `src/lib/prisma.ts`.

## ⚙️ When adding features

1. Update the Prisma schema and run a migration (remember to regenerate the client).
2. Add or modify a Zod schema in `src/lib/schemas.ts`; export associated TypeScript types.
3. Create API routes under `src/app/api/prisma/...` using existing response/validation patterns.
4. If the route is used by the UI, add a hook under `src/lib/hooks` and a form/component under `src/components`.
5. Add tests? (There are currently no automated tests; choose your own framework if you introduce them.)
6. Run `pnpm lint`, `pnpm type-check`, `pnpm format`; commit with a Conventional Commit message.

> **Note:** this file is updated automatically by AI or manually; if something seems wrong or outdated, modify it and let the agent know.
