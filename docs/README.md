# Prisma v7 Documentation

This folder contains comprehensive documentation for the Prisma v7 implementation in the Skolaroid project.

## 📚 Documentation Files

### 1. [PRISMA_V7_SETUP.md](./PRISMA_V7_SETUP.md) - Setup & Configuration Guide

**Start here for:**

- Understanding Prisma v7 architecture changes from v6
- Configuration file setup (`prisma.config.ts`)
- Environment variables (`DATABASE_URL` vs `DIRECT_URL`)
- Prisma Client singleton pattern
- Migration workflow
- File structure overview

**Key Topics:**

- Configuration files explanation
- Database adapter setup (PrismaPg)
- Connection pooling vs direct connections
- Common troubleshooting for setup

**Best for:** Initial setup and understanding the architecture

### 2. [PRISMA_QUICK_REFERENCE.md](./PRISMA_QUICK_REFERENCE.md) - Quick Reference Guide

**Start here for:**

- Quick commands for common operations
- Copy-paste code examples
- Filtering and query patterns
- Error handling
- Type safety tips
- Performance best practices

**Key Topics:**

- All CRUD operations with examples
- Filtering operators and conditions
- Transactions and bulk operations
- API route patterns
- Performance tips

**Best for:** Daily development work and quick lookups

### 3. [PRISMA_TROUBLESHOOTING.md](./PRISMA_TROUBLESHOOTING.md) - Troubleshooting Guide

**Start here for:**

- Solving authentication and connection issues
- Migration errors
- Client generation problems
- Runtime issues
- Database constraint violations
- Performance debugging

**Key Topics:**

- Common error messages and solutions
- Connection string issues
- Special character encoding
- Migration conflicts
- Query optimization
- Debugging tools

**Best for:** When something breaks or doesn't work

### 4. [PRISMA_API_DEMO.md](./PRISMA_API_DEMO.md) - API Demo Documentation

**Start here for:**

- Understanding the demo application
- API endpoint documentation
- Request/response examples
- Testing with cURL
- Frontend demo interface
- User schema details

**Key Topics:**

- Complete REST API documentation
- Create, read, update, delete operations
- Error scenarios
- cURL examples
- Frontend demo usage

**Best for:** Learning by example and API integration

## 🚀 Quick Start

### Step 1: Initial Setup

1. Read [PRISMA_V7_SETUP.md](./PRISMA_V7_SETUP.md)
2. Configure `prisma.config.ts` and `.env`
3. Install dependencies: `npm install @prisma/adapter-pg pg`

### Step 2: Create Database Table

```bash
npx prisma migrate dev --name init
```

### Step 3: Use Prisma in Your Code

```typescript
import { prisma } from '@/lib/prisma';

// Create
const user = await prisma.user.create({
  data: { email: 'user@example.com', name: 'John' },
});

// Read
const users = await prisma.user.findMany();

// Update
await prisma.user.update({
  where: { id: 1 },
  data: { name: 'Jane' },
});

// Delete
await prisma.user.delete({ where: { id: 1 } });
```

### Step 4: Test with Demo

Visit `http://localhost:3000` to test all operations in the UI

## 🔍 How to Use This Documentation

### If you want to...

**Set up Prisma for the first time:**

1. [PRISMA_V7_SETUP.md](./PRISMA_V7_SETUP.md)
2. [PRISMA_QUICK_REFERENCE.md](./PRISMA_QUICK_REFERENCE.md) - Commands section

**Understand how something works:**
→ [PRISMA_V7_SETUP.md](./PRISMA_V7_SETUP.md) for architecture
→ [PRISMA_QUICK_REFERENCE.md](./PRISMA_QUICK_REFERENCE.md) for examples

**Find example code:**
→ [PRISMA_QUICK_REFERENCE.md](./PRISMA_QUICK_REFERENCE.md)
→ [PRISMA_API_DEMO.md](./PRISMA_API_DEMO.md)

**Fix an error:**
→ [PRISMA_TROUBLESHOOTING.md](./PRISMA_TROUBLESHOOTING.md)

**Learn about the API endpoints:**
→ [PRISMA_API_DEMO.md](./PRISMA_API_DEMO.md)

**Test operations:**
→ [PRISMA_API_DEMO.md](./PRISMA_API_DEMO.md) - Testing section

## 📋 Documentation Map

```
PRISMA v7 Documentation
├── Setup & Architecture
│   └── PRISMA_V7_SETUP.md
│       ├── Configuration
│       ├── Environment setup
│       └── Client initialization
│
├── Daily Development
│   └── PRISMA_QUICK_REFERENCE.md
│       ├── Commands
│       ├── CRUD operations
│       ├── Filtering & querying
│       └── Best practices
│
├── API & Demo
│   └── PRISMA_API_DEMO.md
│       ├── Endpoints documentation
│       ├── Request/response examples
│       ├── Frontend demo
│       └── Testing
│
└── Problem Solving
    └── PRISMA_TROUBLESHOOTING.md
        ├── Connection issues
        ├── Migration problems
        ├── Runtime errors
        └── Performance debugging
```

## 🛠️ Key Technologies

- **Prisma ORM**: v7.x
- **Database**: PostgreSQL (via Supabase)
- **Adapter**: @prisma/adapter-pg
- **Connection**: Direct TCP with pooling
- **Framework**: Next.js App Router

## 📁 Project Structure

```
Skolaroid/
├── docs/                    # Documentation folder
│   ├── README.md           # This file
│   ├── PRISMA_V7_SETUP.md
│   ├── PRISMA_QUICK_REFERENCE.md
│   ├── PRISMA_TROUBLESHOOTING.md
│   └── PRISMA_API_DEMO.md
│
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Migration files
│   └── seed.ts            # Optional seed script
│
├── src/
│   ├── lib/
│   │   └── prisma.ts      # Client singleton
│   ├── app/
│   │   ├── page.tsx       # Demo UI
│   │   └── api/
│   │       └── prisma/
│   │           └── user/  # API endpoints
│   └── generated/
│       └── prisma/        # Generated client
│
├── prisma.config.ts       # Prisma v7 config
└── .env                   # Environment variables
```

## 🔗 External Resources

- **[Prisma Official Docs](https://www.prisma.io/docs)**
- **[Prisma v7 Migration Guide](https://www.prisma.io/docs/orm/more/upgrade-guides)**
- **[PostgreSQL Adapter Docs](https://www.prisma.io/docs/orm/overview/databases/postgresql)**
- **[Supabase Connection Guide](https://supabase.com/docs/guides/database/connecting-to-postgres)**
- **[Prisma Discord Community](https://discord.gg/prisma)**

## 💡 Tips

1. **Always use `DIRECT_URL` for migrations** (without pgbouncer)
2. **Use `DATABASE_URL` for application runtime** (with pgbouncer for pooling)
3. **Generate client after schema changes**: `npx prisma generate`
4. **Use `.env.local` for local overrides** without affecting version control
5. **Enable query logging during development** to understand what's happening
6. **Test API endpoints with cURL** before frontend integration

## ❓ FAQ

**Q: Why do I need two connection URLs?**
A: `DIRECT_URL` (no pooling) is required for migrations. `DATABASE_URL` (with pooling) is for runtime to handle many concurrent connections efficiently.

**Q: Where is the Prisma Client generated?**
A: In `src/generated/prisma/client.ts` as specified in `prisma/schema.prisma`.

**Q: How do I add a new model?**
A: 1. Add model to `prisma/schema.prisma` 2. Run `npx prisma migrate dev --name add_modelname` 3. Use in code via `prisma.modelname.*`

**Q: Can I use Prisma Accelerate?**
A: Yes, but it requires additional setup. The current setup uses Direct TCP adapters.

**Q: How do I reset the database?**
A: Run `npx prisma migrate reset` (development only, resets and re-seeds data)

## 📝 Contributing

When updating documentation:

1. Keep examples up-to-date with code
2. Test all commands and examples
3. Include before/after comparisons
4. Link related sections
5. Update this README if adding new files

## 📄 Version Info

- **Prisma**: v7.x
- **Node.js**: v18+ (recommended v20+)
- **PostgreSQL**: 12+
- **Next.js**: v16+

---

**Last Updated:** January 2024
**Status:** Complete and tested
