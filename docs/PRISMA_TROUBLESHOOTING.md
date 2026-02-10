# Prisma v7 Troubleshooting Guide

## Authentication & Connection Issues

### Problem: P1000 - Authentication Failed

**Error Message:**

```
P1000: Authentication failed against database server, the provided database credentials for `postgres` are not valid.
```

**Causes:**

1. Invalid username or password
2. Special characters in password not URL-encoded
3. Database server is down
4. Firewall/network blocking connection
5. Wrong host or port

**Solutions:**

1. **Verify credentials:**

   ```bash
   # Test connection with psql
   psql "postgresql://user:password@host:5432/database"
   ```

2. **Check for special characters:**
   - Passwords with special characters need URL encoding
   - Example: `pass@word` → `pass%40word`
   - Example: `[password]` → `%5Bpassword%5D`

3. **Verify connection string format:**

   ```
   postgresql://username:password@hostname:port/database
   ```

4. **Check environment variables:**

   ```bash
   # Print variables (be careful with sensitive data)
   echo $DIRECT_URL
   echo $DATABASE_URL
   ```

5. **Test with .env.local:**
   Create `c:\Users\Administrator\Documents\Coding\Projects\Skolaroid\.env.local` with hardcoded credentials to test

### Problem: P1001 - Can't Reach Database Server

**Error Message:**

```
P1001: Can't reach database server at `hostname:port`
```

**Causes:**

1. Network connectivity issue
2. Wrong hostname or port
3. Database server not running
4. Firewall blocking connection

**Solutions:**

1. **Check network connectivity:**

   ```bash
   ping aws-1-ap-southeast-1.pooler.supabase.com
   ```

2. **Test port accessibility:**

   ```bash
   # Use telnet or similar
   nc -zv aws-1-ap-southeast-1.pooler.supabase.com 5432
   ```

3. **Verify connection string:**
   - Migrations: Use port 5432 (DIRECT_URL)
   - Runtime: Use port 6543 (DATABASE_URL with pgbouncer)

4. **Check Supabase project:**
   - Verify project is active in Supabase dashboard
   - Check project settings for connection details

### Problem: Connection Pooling Issues

**Error:** Timeout or "too many connections"

**Solutions:**

1. **Use correct connection strings:**

   ```env
   # Runtime: With pgbouncer (port 6543)
   DATABASE_URL="...pooler.supabase.com:6543/postgres?pgbouncer=true"

   # Migrations: Direct (port 5432)
   DIRECT_URL="...pooler.supabase.com:5432/postgres"
   ```

2. **Limit concurrent connections:**

   ```typescript
   const adapter = new PrismaPg({
     connectionString: process.env.DATABASE_URL,
   });
   ```

3. **Close connections properly:**
   ```typescript
   // Always disconnect when done
   await prisma.$disconnect();
   ```

## Migration Issues

### Problem: Migration Fails with P1000 Error

**Solution:** Use `DIRECT_URL` in `prisma.config.ts`

```typescript
export default defineConfig({
  datasource: {
    url: process.env['DIRECT_URL'] || process.env['DATABASE_URL'],
  },
});
```

The `DIRECT_URL` doesn't use pgbouncer and is required for migrations.

### Problem: "Migration Conflict" Error

**Error Message:**

```
Conflict detected: both databases have migrations the other doesn't know about
```

**Causes:**

1. Migrations run outside of Prisma
2. Multiple developers merging migrations
3. Pulling changes with new migrations

**Solutions:**

1. **List migration status:**

   ```bash
   npx prisma migrate status
   ```

2. **Resolve conflict:**

   ```bash
   # Mark conflicting migration as rolled back
   npx prisma migrate resolve --rolled-back [migration_name]
   ```

3. **Reset database (dev only):**
   ```bash
   npx prisma migrate reset
   ```

### Problem: Schema Validation Error

**Error Message:**

```
Syntax error in schema.prisma at...
```

**Causes:**

1. Invalid Prisma schema syntax
2. Missing attributes or types
3. Circular references

**Solutions:**

1. **Check schema syntax:**

   ```bash
   npx prisma validate
   ```

2. **Validate model definition:**

   ```prisma
   model User {
     id        Int     @id @default(autoincrement())
     email     String  @unique
     name      String?
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
   }
   ```

3. **Common mistakes:**
   - Missing `?` for optional fields
   - Wrong type names (String not string)
   - Missing `@id` on primary key

## Client Generation Issues

### Problem: Module Not Found - '@/generated/prisma'

**Error Message:**

```
Cannot find module '@/generated/prisma'
```

**Causes:**

1. Prisma client not generated
2. Wrong output path in schema
3. Path alias not configured

**Solutions:**

1. **Generate Prisma Client:**

   ```bash
   npx prisma generate
   ```

2. **Check schema.prisma generator:**

   ```prisma
   generator client {
     provider = "prisma-client"
     output   = "../src/generated/prisma"
   }
   ```

3. **Verify path alias in tsconfig.json:**

   ```json
   {
     "compilerOptions": {
       "baseUrl": ".",
       "paths": {
         "@/*": ["./src/*"]
       }
     }
   }
   ```

4. **Clear cache and rebuild:**
   ```bash
   rm -rf node_modules/.prisma
   npx prisma generate
   npm run build
   ```

### Problem: Types Not Found in Generated Client

**Solutions:**

1. **Regenerate client:**

   ```bash
   npx prisma generate
   ```

2. **Check imports:**

   ```typescript
   // ✓ Correct
   import { User } from '@/generated/prisma/client';

   // ✗ Wrong
   import { User } from '@prisma/client';
   ```

3. **Verify package.json has `@prisma/adapter-pg`:**
   ```bash
   npm list @prisma/adapter-pg
   ```

## Runtime Issues

### Problem: PrismaClient Not Exported

**Error Message:**

```
Cannot find name 'PrismaClient'
```

**Causes:**

1. Not importing from generated path
2. Wrong import path

**Solutions:**

```typescript
// ✓ Correct for Prisma v7
import { PrismaClient } from '@/generated/prisma/client';

// ✗ Wrong - doesn't work with adapter-pg
import { PrismaClient } from '@prisma/client';
```

### Problem: PrismaPg Constructor Error

**Error Message:**

```
Expected 1 arguments, but got 0
```

**Causes:**

1. Missing configuration object
2. Wrong constructor signature

**Solutions:**

```typescript
// ✓ Correct
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

// ✗ Wrong - missing config
const adapter = new PrismaPg();
```

### Problem: Operation Timeout

**Error Message:**

```
Query took too long
```

**Solutions:**

1. **Add timeout to operations:**

   ```typescript
   const user = await Promise.race([
     prisma.user.findUnique({ where: { id: 1 } }),
     new Promise((_, reject) =>
       setTimeout(() => reject(new Error('Timeout')), 5000)
     ),
   ]);
   ```

2. **Optimize queries:**

   ```typescript
   // Bad - fetches all fields
   const users = await prisma.user.findMany();

   // Good - fetch only needed fields
   const users = await prisma.user.findMany({
     select: { id: true, email: true },
   });
   ```

3. **Check database performance:**
   - Add indexes to frequently queried fields
   - Check database load in Supabase dashboard

## Development Workflow Issues

### Problem: Changes to schema.prisma Don't Apply

**Solution:** Regenerate and migrate

```bash
# 1. Update schema.prisma
# 2. Create migration
npx prisma migrate dev --name describe_changes

# 3. Generate client
npx prisma generate
```

### Problem: .env Changes Not Reflecting

**Solutions:**

1. **Restart development server:**

   ```bash
   # Stop with Ctrl+C, then restart
   npm run dev
   ```

2. **Check file is being read:**

   ```bash
   # Verify .env exists and has correct variables
   cat .env
   ```

3. **Use .env.local for overrides:**
   ```env
   # .env.local (takes precedence)
   DIRECT_URL="..."
   ```

### Problem: Type Errors After Migration

**Solution:** Regenerate types

```bash
npx prisma generate
npm run build
```

## Database Issues

### Problem: Unique Constraint Violation

**Error Code:** P2002

**Causes:**

1. Attempting to create record with duplicate unique field
2. Multiple records with same unique value

**Solutions:**

```typescript
// Use upsert to create or update
const user = await prisma.user.upsert({
  where: { email: 'user@example.com' },
  update: { name: 'Updated Name' },
  create: { email: 'user@example.com', name: 'New User' },
});

// Or use skipDuplicates with createMany
const result = await prisma.user.createMany({
  data: [...],
  skipDuplicates: true,
});
```

### Problem: Foreign Key Constraint Violation

**Error Code:** P2003

**Causes:**

1. Referenced record doesn't exist
2. Deleting record with foreign key references

**Solutions:**

```typescript
// Verify referenced record exists
const relatedRecord = await prisma.otherModel.findUnique({
  where: { id: foreignKeyValue },
});

if (!relatedRecord) {
  throw new Error('Referenced record not found');
}

// Then perform operation
const record = await prisma.model.create({
  data: { ...},
});
```

### Problem: Record Not Found in Unique Query

**Error Code:** P2025

**Solutions:**

```typescript
// Use findUnique with careful null handling
const user = await prisma.user
  .findUnique({
    where: { id: 1 },
  })
  .catch(() => null); // Handle record not found

if (!user) {
  return NextResponse.json({ error: 'User not found' }, { status: 404 });
}

// Or use findFirst for more flexible queries
const user = await prisma.user.findFirst({
  where: { email: 'user@example.com' },
});
```

## Debugging Commands

### View All Environment Variables

```bash
env | grep -E "DATABASE_URL|DIRECT_URL|ACCELERATE"
```

### Check Prisma Version

```bash
npx prisma --version
```

### Validate Schema

```bash
npx prisma validate
```

### Check Migration History

```bash
npx prisma migrate status
```

### Reset Database (Development Only)

```bash
npx prisma migrate reset
```

### View Database with Studio

```bash
npx prisma studio
```

## Performance Diagnostics

### Enable Query Logging

Update `src/lib/prisma.ts`:

```typescript
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL || '';
  const adapter = new PrismaPg({
    connectionString,
  });

  return new PrismaClient({
    adapter,
    log: [
      { emit: 'stdout', level: 'query' },
      { emit: 'stdout', level: 'error' },
    ],
  });
}
```

### Monitor Connections

```bash
# Connect to Supabase and check active connections
psql "postgresql://..." -c "SELECT count(*) FROM pg_stat_activity;"
```

## Getting Help

1. **Check error codes:** https://www.prisma.io/docs/reference/api-reference/error-reference
2. **Prisma Discord:** https://discord.gg/prisma
3. **GitHub Issues:** https://github.com/prisma/prisma/issues
4. **Supabase Docs:** https://supabase.com/docs/guides/database/connecting-to-postgres
