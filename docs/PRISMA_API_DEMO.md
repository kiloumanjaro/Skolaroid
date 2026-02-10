# Prisma v7 API Demo Documentation

## Overview

The demo application showcases all CRUD operations using Prisma v7 with a interactive UI and REST API endpoints.

## Live Demo Interface

**Location:** `src/app/page.tsx`

A client-side React component with buttons to trigger each operation and real-time display of results.

### Features

- ✅ Create single user
- ✅ Create multiple users
- ✅ Delete single user
- ✅ Delete all users
- ✅ View all users
- 📊 Real-time JSON output display
- 📋 Live user list

## API Endpoints

All endpoints are located in `src/app/api/prisma/user/`

### 1. Create Single User

**Endpoint:** `POST /api/prisma/user/create`

**Request:**

```json
{
  "email": "user@example.com",
  "name": "John Doe"
}
```

**Response (Success):**

```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Response (Error):**

```json
{
  "error": "Email is required"
}
```

**Status Codes:**

- `200` - User created successfully
- `400` - Validation error (missing email)
- `500` - Server error

**Implementation:**

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

### 2. Create Multiple Users

**Endpoint:** `POST /api/prisma/user/create-many`

**Request:**

```json
{
  "users": [
    { "email": "alice@example.com", "name": "Alice" },
    { "email": "bob@example.com", "name": "Bob" },
    { "email": "charlie@example.com", "name": "Charlie" }
  ]
}
```

**Response (Success):**

```json
{
  "success": true,
  "message": "Users created successfully",
  "count": 3
}
```

**Response (Error):**

```json
{
  "error": "Users array is required and must not be empty"
}
```

**Status Codes:**

- `200` - Users created successfully
- `400` - Validation error (empty or missing array)
- `500` - Server error (duplicate emails)

**Implementation:**

```typescript
export async function POST(request: NextRequest) {
  try {
    const { users } = await request.json();

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        { error: 'Users array is required and must not be empty' },
        { status: 400 }
      );
    }

    const result = await prisma.user.createMany({
      data: users.map((user: { email: string; name?: string }) => ({
        email: user.email,
        name: user.name || null,
      })),
      skipDuplicates: true, // Skip if email already exists
    });

    return NextResponse.json({
      success: true,
      message: 'Users created successfully',
      count: result.count,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**Notes:**

- `skipDuplicates: true` prevents errors when emails already exist
- Returns count of successfully created users
- Partial success is possible (some created, some skipped)

### 3. Delete Single User

**Endpoint:** `DELETE /api/prisma/user/delete`

**Request:**

```json
{
  "id": 1
}
```

**Response (Success):**

```json
{
  "success": true,
  "message": "User deleted successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Response (Error):**

```json
{
  "error": "User ID is required"
}
```

**Status Codes:**

- `200` - User deleted successfully
- `400` - Validation error (missing ID)
- `500` - Server error (user not found or delete failed)

**Implementation:**

```typescript
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
      user,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

### 4. Delete All Users

**Endpoint:** `DELETE /api/prisma/user/delete-many`

**Request:**

```
No request body needed
```

**Response (Success):**

```json
{
  "success": true,
  "message": "All users deleted successfully",
  "count": 5
}
```

**Response (Error):**

```json
{
  "error": "Database connection failed"
}
```

**Status Codes:**

- `200` - All users deleted successfully
- `500` - Server error

**Implementation:**

```typescript
export async function DELETE(request: NextRequest) {
  try {
    const result = await prisma.user.deleteMany({
      where: {}, // Delete all records
    });

    return NextResponse.json({
      success: true,
      message: 'All users deleted successfully',
      count: result.count,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

### 5. Get All Users

**Endpoint:** `GET /api/prisma/user/get-all`

**Request:**

```
No request body needed
```

**Response (Success):**

```json
{
  "success": true,
  "users": [
    {
      "id": 1,
      "email": "user1@example.com",
      "name": "User 1",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "email": "user2@example.com",
      "name": "User 2",
      "createdAt": "2024-01-15T10:35:00Z",
      "updatedAt": "2024-01-15T10:35:00Z"
    }
  ]
}
```

**Response (Empty):**

```json
{
  "success": true,
  "users": []
}
```

**Status Codes:**

- `200` - Users retrieved successfully
- `500` - Server error

**Implementation:**

```typescript
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }, // Newest first
    });

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

## Testing with cURL

### Create User

```bash
curl -X POST http://localhost:3000/api/prisma/user/create \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User"
  }'
```

### Create Multiple Users

```bash
curl -X POST http://localhost:3000/api/prisma/user/create-many \
  -H "Content-Type: application/json" \
  -d '{
    "users": [
      {"email": "user1@example.com", "name": "User 1"},
      {"email": "user2@example.com", "name": "User 2"}
    ]
  }'
```

### Delete User

```bash
curl -X DELETE http://localhost:3000/api/prisma/user/delete \
  -H "Content-Type: application/json" \
  -d '{"id": 1}'
```

### Delete All Users

```bash
curl -X DELETE http://localhost:3000/api/prisma/user/delete-many
```

### Get All Users

```bash
curl http://localhost:3000/api/prisma/user/get-all
```

## Testing with Frontend Demo

1. **Start development server:**

   ```bash
   npm run dev
   ```

2. **Navigate to:** `http://localhost:3000`

3. **Use the buttons:**
   - "Create Single User" - Creates one user with hardcoded data
   - "Create Multiple Users" - Creates 3 users at once
   - "Delete Single User" - Deletes the first user in the list
   - "Delete All Users" - Clears all users (red button)
   - "Fetch All Users" - Refreshes the user list

4. **View results:**
   - JSON output shows API response
   - User list shows all current users in database

## User Schema

```prisma
model User {
  id        Int     @id @default(autoincrement())
  email     String  @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Field Definitions

| Field     | Type     | Required | Notes                                      |
| --------- | -------- | -------- | ------------------------------------------ |
| id        | Int      | ✓        | Auto-incrementing primary key              |
| email     | String   | ✓        | Must be unique, used to prevent duplicates |
| name      | String   | ✗        | Optional user name                         |
| createdAt | DateTime | ✓        | Auto-set when record created               |
| updatedAt | DateTime | ✓        | Auto-updated on each modification          |

## Error Scenarios

### Duplicate Email

**Trying to create user with existing email:**

```json
{
  "error": "Unique constraint failed on the fields: (`email`)"
}
```

**Solution:** Use different email or upsert operation

### User Not Found

**Deleting non-existent user:**

```json
{
  "error": "Record not found"
}
```

**Solution:** Verify user ID exists before deleting

### Database Connection Error

**When database is unavailable:**

```json
{
  "error": "Can't reach database server"
}
```

**Solution:** Check DATABASE_URL and network connectivity

## Performance Tips

1. **Batch Operations**: Use `createMany` and `deleteMany` for multiple records
2. **Select Specific Fields**: Only fetch needed fields to reduce bandwidth
3. **Add Pagination**: Use `take` and `skip` for large datasets
4. **Index Frequently Queried Fields**: Add indexes in schema for better performance

## Next Steps

1. **Add more operations:**
   - Update user (PUT endpoint)
   - Find user by email
   - Advanced filtering

2. **Add authentication:**
   - Validate requests
   - Add role-based access control

3. **Optimize:**
   - Add caching
   - Implement pagination
   - Add sorting options

4. **Testing:**
   - Unit tests for API routes
   - Integration tests with database
   - Load testing

## Related Documentation

- [PRISMA_V7_SETUP.md](./PRISMA_V7_SETUP.md) - Setup and configuration
- [PRISMA_QUICK_REFERENCE.md](./PRISMA_QUICK_REFERENCE.md) - Common operations
- [PRISMA_TROUBLESHOOTING.md](./PRISMA_TROUBLESHOOTING.md) - Problem solving
