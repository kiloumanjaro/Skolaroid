# Architecture Guide

This document outlines the recommended architecture and data flow patterns for this project.

## Technology Stack

- **Frontend**: React 19 with Next.js (App Router)
- **Data Fetching**: TanStack Query (React Query)
- **Validation**: Zod
- **Database**: Prisma with PostgreSQL
- **UI**: Radix UI + Tailwind CSS
- **Authentication**: Supabase

## Data Flow

The standard flow for any feature involving data fetching or mutation is:

```
UI Component
    ↓
TanStack Query Hook (useQuery/useMutation)
    ↓
API Route (route.ts) with Zod validation
    ↓
Service Layer (business logic)
    ↓
Prisma/Database
```

### Example: User Login Flow

```typescript
// 1. UI Component calls the hook
const { mutate: login, isPending } = useLogin();

function LoginForm() {
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      login({ email, password });
    }}>
      {/* form fields */}
    </form>
  );
}

// 2. TanStack Query Hook (src/lib/hooks/useLogin.ts)
import { useMutation } from '@tanstack/react-query';
import { loginSchema, type LoginInput } from '@/lib/schemas';

export function useLogin() {
  return useMutation({
    mutationFn: async (data: LoginInput) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Login failed');
      return res.json();
    },
  });
}

// 3. API Route validates and processes (src/app/api/auth/login/route.ts)
import { loginSchema } from '@/lib/schemas';
import { loginService } from '@/services/auth';

export async function POST(req: Request) {
  const body = await req.json();

  // Validate with Zod
  const result = loginSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { error: 'Invalid credentials', details: result.error.flatten() },
      { status: 400 }
    );
  }

  try {
    // Call service layer
    const user = await loginService(result.data);
    return Response.json(user);
  } catch (error) {
    return Response.json(
      { error: 'Login failed' },
      { status: 401 }
    );
  }
}

// 4. Service Layer handles business logic (src/services/auth.ts)
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/password';
import type { LoginInput } from '@/lib/schemas';

export async function loginService(data: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user || !(await verifyPassword(data.password, user.passwordHash))) {
    throw new Error('Invalid credentials');
  }

  // Create session, set cookies, etc.
  return { id: user.id, email: user.email };
}
```

## Directory Structure

```
src/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   ├── auth/                 # Auth pages
│   ├── protected/            # Protected routes
│   └── page.tsx              # Home page
├── components/               # React components
│   ├── ui/                   # UI components (Radix UI)
│   ├── forms/                # Form components
│   └── auth-button.tsx       # Example component
├── lib/
│   ├── schemas.ts            # Zod validation schemas
│   ├── hooks/                # Custom React hooks (TanStack Query hooks)
│   └── utils/                # Utility functions
├── services/                 # Business logic layer
│   ├── auth.ts               # Auth service
│   ├── user.ts               # User service
│   └── index.ts              # Export all services
└── styles/                   # Global styles
```

## Key Patterns

### 1. Always Use Zod for Validation

Validate all external inputs (API requests, form submissions) with Zod schemas:

```typescript
// src/lib/schemas.ts
export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// src/app/api/users/create/route.ts
const result = createUserSchema.safeParse(body);
if (!result.success) {
  return Response.json({ error: result.error }, { status: 400 });
}
```

**When**: Every API route that accepts user input.

### 2. Use TanStack Query for Data Fetching

Never use raw `fetch()` in components. Always wrap in a TanStack Query hook:

```typescript
// ❌ Don't do this
function MyComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/data')
      .then((r) => r.json())
      .then(setData);
  }, []);
}

// ✅ Do this
function MyComponent() {
  const { data } = useQuery({
    queryKey: ['data'],
    queryFn: () => fetch('/api/data').then((r) => r.json()),
  });
}

// Or better, extract to a hook
export function useData() {
  return useQuery({
    queryKey: ['data'],
    queryFn: () => fetch('/api/data').then((r) => r.json()),
  });
}
```

**Benefits**:

- Automatic caching
- Built-in error handling
- Automatic retries
- Loading/error states
- Deduplication of requests

**When**: Any component that fetches or mutates data.

### 3. Service Layer: Extract When Complex

Extract business logic to `src/services/` when it involves **non-trivial logic** — multi-step queries, cursor pagination, aggregations, or anything that would benefit from reuse or isolated testing. Simple CRUD operations (a single `prisma.create`, `prisma.update`, or `prisma.delete`) can stay inlined in the API route.

```typescript
// ✅ Simple CRUD — inline in route (no service needed)
// src/app/api/prisma/memory/comment/create/route.ts
const comment = await prisma.memoryComment.create({
  data: { memoryId, authorId, content },
  include: {
    author: { select: { id: true, firstName: true, lastName: true } },
  },
});
return Response.json({ success: true, data: comment });

// ✅ Complex logic — extract to service
// src/services/get-comments-service.ts
export async function getCommentsService(
  memoryId: string,
  limit: number,
  cursor?: string
) {
  const rows = await prisma.memoryComment.findMany({
    where: { memoryId, deletedAt: null },
    take: limit + 1, // fetch one extra to determine hasMore
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, -1) : rows;
  return {
    items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
    hasMore,
  };
}
```

**Rule of thumb**: if the Prisma call fits in ~3 lines and has no branching logic, keep it in the route. If it involves pagination, multi-table coordination, or business rules, extract it.

### 4. Use Type Inference from Zod

Get TypeScript types directly from your schemas:

```typescript
import { z } from 'zod';

export const userSchema = z.object({
  email: z.string().email(),
  name: z.string(),
});

// Infer type from schema
export type User = z.infer<typeof userSchema>;

// Now User is { email: string; name: string }
// If you update the schema, the type updates automatically
```

**When**: Defining input/output types.

## Common Mistakes to Avoid

❌ **Don't use raw fetch in components**

- Use TanStack Query hooks instead

❌ **Don't skip Zod validation**

- Every API route should validate input
- Invalid data should never reach your database

❌ **Don't put complex business logic in API routes**

- Extract to service layer when logic is non-trivial (pagination, multi-step queries)
- Simple single-call CRUD can stay inlined in the route

❌ **Don't create useState for loading/error states**

- TanStack Query handles this automatically

❌ **Don't commit without running pre-push checks**

- Your Husky hooks will catch TypeScript errors
- Run `pnpm type-check && pnpm lint` manually if needed

## Development Workflow

1. **Define Zod schema** (`src/lib/schemas.ts`)
2. **Create API route** with Zod validation (`src/app/api/.../route.ts`)
3. **Create service function** with business logic (`src/services/...`)
4. **Create TanStack Query hook** (`src/lib/hooks/use...`)
5. **Use hook in component** (`src/components/.../...tsx`)

## Testing Your Code

Before pushing, ensure:

```bash
# Type checking
pnpm type-check

# Linting
pnpm lint

# Format check
pnpm format:check
```

These run automatically on `git push`, but you can run them manually.

## Adding New Features

When adding a new feature, follow this checklist:

- [ ] Create Zod schema for inputs
- [ ] Create API route with validation
- [ ] Create service layer function
- [ ] Create TanStack Query hook
- [ ] Build UI component using the hook
- [ ] Test manually
- [ ] Run `pnpm type-check && pnpm lint`
- [ ] Commit with descriptive message

## Serving the mobile app

The Expo app in `../Skolaroid-Mobile` is a client of this backend. It shares
the Supabase project, the database and the user accounts; it has no Prisma of
its own.

**Auth.** Browsers send the Supabase session cookie. Native clients have no
cookie jar, so the app sends `Authorization: Bearer <access_token>` and
`src/lib/supabase/server.ts` forwards that header to `createServerClient`. The
header is only consulted when present, so cookie auth is unchanged. Do not
remove that branch — it is the only thing letting the app authenticate.

**`/api/mobile/*`.** Three properties of the web routes do not survive a
cellular connection: lists are unbounded, list payloads carry every story body,
and there is no single-memory route. Two endpoints exist for that:

- `GET /api/mobile/feed` — cursor-paged, server-filtered memory list, without
  `description`.
- `GET /api/mobile/memory/[memoryId]` — one memory, plus the viewer's vote and
  ownership.

Both send `Cache-Control: private, no-store`; they are per-user and must never
be held by a CDN.

**`src/lib/server/memory-visibility.ts`.** `loadViewer` and `visibleToViewer`
are the single definition of who may see which memory. The same predicate is
still inlined in the older `get-all-with-coordinates`, `get-by-location` and
`get-by-group` routes; when you touch one of those, move it onto the helper.
A drift between copies silently leaks private memories.

When adding a route the app will call, check
`../Skolaroid-Mobile/docs/BACKEND_CONTRACT.md` — it documents the contract from
the client side.

## Questions?

Refer to this guide when:

- Deciding where to put code
- Uncertain about the data flow
- Building a new feature
- Reviewing a colleague's code
