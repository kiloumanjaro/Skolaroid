# Prisma v7 Implementation Guide

## Overview

This project uses **Prisma ORM v7** with PostgreSQL via Supabase. Prisma v7 introduces a new architecture with mandatory database adapters and a new configuration system via `prisma.config.ts`.

## Architecture

### Key Changes from Prisma v6

1. **Mandatory Database Adapters**: Prisma v7 requires explicit adapters instead of relying on node protocol drivers
2. **New Config File**: `prisma.config.ts` centralizes all Prisma configuration
3. **ESM-First**: Full ESM support with proper module resolution
4. **Direct TCP Connections**: Uses the `@prisma/adapter-pg` for PostgreSQL connections

## Configuration Files

### prisma.config.ts

Located at the project root, this file configures Prisma CLI and data source settings:

```typescript
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DIRECT_URL'] || process.env['DATABASE_URL'],
  },
});
```

**Key Points:**

- Uses `DIRECT_URL` for migrations (direct TCP connection without pooling)
- Falls back to `DATABASE_URL` if `DIRECT_URL` is not available
- Loads environment variables via `dotenv/config`

### prisma/schema.prisma

Defines the database schema:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model User {
  id        Int     @id @default(autoincrement())
  email     String  @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Important:**

- No `url` property in datasource (handled by prisma.config.ts)
- Generator outputs to `../src/generated/prisma` for app usage

## Environment Configuration

### .env File

```env
# Connection pooling - for application runtime (with pgbouncer)
DATABASE_URL="postgresql://user:password@host:6543/database?pgbouncer=true"

# Direct connection - for migrations (without pooling)
DIRECT_URL="postgresql://user:password@host:5432/database"
```

**Connection String Format (URL-encoded special characters):**

- Password with brackets: `password` → Use plain text (no encoding needed after fix)
- If special chars present: Use `%XX` encoding (e.g., `%5B` for `[`)

### .env.local (Optional)

For local overrides or sensitive data not in version control.

## Prisma Client Setup

### src/lib/prisma.ts

Centralized Prisma Client instance with proper singleton pattern:

```typescript
import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

declare global {
  var prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL || '';
  const adapter = new PrismaPg({
    connectionString,
  });
  return new PrismaClient({ adapter });
}

export const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;
```

**Features:**

- Uses `PrismaPg` adapter for PostgreSQL with direct TCP
- Singleton pattern prevents multiple client instances
- Proper reuse in development environment
- Uses `DATABASE_URL` (with connection pooling) for application runtime

## Database Operations

### API Routes

Located in `src/app/api/prisma/user/`:

#### Create Single User

**Route:** `POST /api/prisma/user/create`

```typescript
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

#### Create Multiple Users

**Route:** `POST /api/prisma/user/create-many`

```typescript
const result = await prisma.user.createMany({
  data: users.map((user) => ({
    email: user.email,
    name: user.name || null,
  })),
  skipDuplicates: true,
});
```

#### Delete Single User

**Route:** `DELETE /api/prisma/user/delete`

```typescript
const user = await prisma.user.delete({
  where: { id },
});
```

#### Delete All Users

**Route:** `DELETE /api/prisma/user/delete-many`

```typescript
const result = await prisma.user.deleteMany({
  where: {},
});
```

#### Fetch All Users

**Route:** `GET /api/prisma/user/get-all`

```typescript
const users = await prisma.user.findMany({
  orderBy: { createdAt: 'desc' },
});
```

## Running Migrations

### Create Initial Migration

```bash
npx prisma migrate dev --name init
```

This command:

1. Analyzes schema changes
2. Creates migration files in `prisma/migrations/`
3. Applies migration to the database using `DIRECT_URL`
4. Regenerates Prisma Client

### Apply Existing Migrations

```bash
npx prisma migrate deploy
```

### Generate Prisma Client

```bash
npx prisma generate
```

## Package Dependencies

### Required Packages

```json
{
  "@prisma/client": "^7.0.0",
  "@prisma/adapter-pg": "^7.0.0",
  "pg": "^8.x.x"
}
```

### Installation

```bash
npm install @prisma/client @prisma/adapter-pg pg
npm install -D prisma
```

## Development Workflow

1. **Update Schema**: Modify `prisma/schema.prisma`
2. **Create Migration**: Run `npx prisma migrate dev --name description`
3. **Generate Client**: Automatically done by migrate, or manually with `npx prisma generate`
4. **Use in Code**: Import from `@/lib/prisma`

## Performance Considerations

### Connection Pooling

- **Runtime**: Uses `DATABASE_URL` with pgbouncer (port 6543) for connection pooling
- **Migrations**: Uses `DIRECT_URL` (port 5432) for direct connections
- **Benefit**: Reduces connection overhead, supports more concurrent connections

### Client Reuse

The singleton pattern in `src/lib/prisma.ts` ensures:

- Single database connection per application instance
- Proper connection lifecycle management
- No connection leaks

## Troubleshooting

### Authentication Errors

**Error:** `P1000: Authentication failed against database server`

**Solutions:**

1. Verify credentials in `DIRECT_URL` and `DATABASE_URL`
2. Check for special characters in password (may need URL encoding)
3. Ensure Supabase project is active
4. Test connection with direct psql command

### Migration Issues

**Error:** `Migration operation failed`

**Solutions:**

1. Ensure `DIRECT_URL` is accessible (no pgbouncer)
2. Check schema syntax in `prisma/schema.prisma`
3. Review migration files in `prisma/migrations/`
4. Use `npx prisma migrate resolve --rolled-back <migration-name>` if needed

### Client Generation Issues

**Error:** `Module not found: '@/generated/prisma'`

**Solutions:**

1. Run `npx prisma generate`
2. Verify output path in `prisma/schema.prisma` generator
3. Check file permissions on generated folder
4. Clear `.next` build cache and rebuild

## File Structure

```
project/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Migration files (auto-generated)
│   └── seed.ts               # Optional seed script
├── prisma.config.ts           # Prisma v7 configuration
├── src/
│   ├── lib/
│   │   └── prisma.ts         # Prisma Client singleton
│   ├── app/
│   │   └── api/
│   │       └── prisma/
│   │           └── user/     # API routes
│   └── generated/
│       └── prisma/           # Generated Prisma Client
├── .env                       # Environment variables
└── docs/                      # Documentation
```

## References

- [Prisma v7 Migration Guide](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-to-prisma-5)
- [Prisma Postgres Adapter](https://www.prisma.io/docs/orm/overview/databases/postgresql)
- [Prisma Configuration](https://www.prisma.io/docs/orm/reference/prisma-schema-reference#datasource)
- [Connection Pooling](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
