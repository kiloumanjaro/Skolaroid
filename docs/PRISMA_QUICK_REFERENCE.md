# Prisma v7 Quick Reference

## Common Commands

### Migrations

```bash
# Create new migration after schema changes
npx prisma migrate dev --name migration_name

# Deploy migrations to production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# Check migration status
npx prisma migrate status
```

### Client Generation

```bash
# Generate Prisma Client
npx prisma generate

# Generate and watch for changes
npx prisma generate --watch
```

### Database Operations

```bash
# Open interactive database browser
npx prisma studio

# Seed database
npx prisma db seed
```

## Using Prisma Client

### Import

```typescript
import { prisma } from '@/lib/prisma';
```

### Create Operations

**Single record:**

```typescript
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe',
  },
});
```

**Multiple records:**

```typescript
const result = await prisma.user.createMany({
  data: [
    { email: 'user1@example.com', name: 'User 1' },
    { email: 'user2@example.com', name: 'User 2' },
  ],
  skipDuplicates: true,
});
```

### Read Operations

**Find single record:**

```typescript
const user = await prisma.user.findUnique({
  where: { id: 1 },
});
```

**Find first matching record:**

```typescript
const user = await prisma.user.findFirst({
  where: { email: 'user@example.com' },
});
```

**Find all records:**

```typescript
const users = await prisma.user.findMany({
  orderBy: { createdAt: 'desc' },
  take: 10,
  skip: 0,
});
```

**Count records:**

```typescript
const count = await prisma.user.count({
  where: { email: { contains: '@gmail.com' } },
});
```

### Update Operations

**Single record:**

```typescript
const user = await prisma.user.update({
  where: { id: 1 },
  data: { name: 'Updated Name' },
});
```

**Multiple records:**

```typescript
const result = await prisma.user.updateMany({
  where: { email: { contains: '@old.com' } },
  data: { name: 'Anonymous' },
});
```

### Delete Operations

**Single record:**

```typescript
const user = await prisma.user.delete({
  where: { id: 1 },
});
```

**Multiple records:**

```typescript
const result = await prisma.user.deleteMany({
  where: { email: { contains: '@example.com' } },
});
```

## Filtering

### Operators

```typescript
// Comparison
{ where: { id: { equals: 1 } } }
{ where: { id: { gt: 5 } } }           // greater than
{ where: { id: { lt: 10 } } }          // less than
{ where: { id: { gte: 5 } } }          // greater than or equal
{ where: { id: { lte: 10 } } }         // less than or equal

// String matching
{ where: { email: { contains: 'gmail' } } }
{ where: { name: { startsWith: 'John' } } }
{ where: { name: { endsWith: 'Doe' } } }
{ where: { name: { mode: 'insensitive', contains: 'john' } } }

// List operators
{ where: { id: { in: [1, 2, 3] } } }
{ where: { id: { notIn: [1, 2, 3] } } }

// Null checks
{ where: { name: { not: null } } }
{ where: { name: null } }
```

### Logical Operators

```typescript
// AND (default)
{ where: { email: 'user@example.com', name: 'John' } }

// OR
{ where: { OR: [ { email: 'user1@example.com' }, { email: 'user2@example.com' } ] } }

// NOT
{ where: { NOT: { email: 'admin@example.com' } } }
```

## Error Handling

```typescript
import { Prisma } from '@/generated/prisma/client';

try {
  const user = await prisma.user.create({
    data: { email: 'user@example.com' },
  });
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      // Unique constraint violation
      console.error('Email already exists');
    }
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    // Validation error
    console.error('Invalid data');
  }
}
```

## Transactions

```typescript
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: { email: 'user@example.com' },
  });

  // Other operations...

  return user;
});
```

## Environment Variables

```env
# Application runtime (with connection pooling)
DATABASE_URL="postgresql://user:pass@host:6543/db?pgbouncer=true"

# Migrations (direct connection, no pooling)
DIRECT_URL="postgresql://user:pass@host:5432/db"
```

## API Routes Pattern

```typescript
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const data = await prisma.user.findMany();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await prisma.user.create({ data: body });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

## Type Safety

```typescript
import { User } from '@/generated/prisma/client';

// Use generated types for parameters
function processUser(user: User) {
  console.log(user.id, user.email);
}

// Get create input type
type UserCreateInput = Parameters<typeof prisma.user.create>[0];

// Get return type
type UserResult = Awaited<ReturnType<typeof prisma.user.findMany>>[0];
```

## Performance Tips

1. **Select specific fields** to reduce data transfer:

```typescript
const users = await prisma.user.findMany({
  select: { id: true, email: true }, // Only fetch these fields
});
```

2. **Use pagination** for large datasets:

```typescript
const users = await prisma.user.findMany({
  take: 10,
  skip: offset,
});
```

3. **Create indexes** on frequently queried fields in schema:

```prisma
model User {
  id    Int     @id
  email String  @unique
  @@index([createdAt])
}
```

4. **Avoid N+1 queries** with proper filtering and selection

## Debugging

### Enable Query Logging

```typescript
const prisma = new PrismaClient({
  log: [
    { emit: 'stdout', level: 'query' },
    { emit: 'stdout', level: 'error' },
    { emit: 'stdout', level: 'warn' },
  ],
});
```

### Prisma Studio

```bash
npx prisma studio
```

Opens interactive database explorer at http://localhost:5555

## Common Errors

| Error Code | Meaning                | Solution                                 |
| ---------- | ---------------------- | ---------------------------------------- |
| P1000      | Authentication failed  | Check credentials in .env                |
| P2002      | Unique constraint      | Field value already exists               |
| P2003      | Foreign key constraint | Referenced record doesn't exist          |
| P2025      | Record not found       | Use `findUnique` properly or handle null |
| P1001      | Can't reach DB         | Check network/connection string          |

## Links

- [Prisma Documentation](https://www.prisma.io/docs)
- [API Reference](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Error Codes](https://www.prisma.io/docs/reference/api-reference/error-reference)
