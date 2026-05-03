# OPUS MASTER DIRECTIVE — SCRUM-XX: Resolve / Dismiss Report Lifecycle

> **You are operating in Agent Mode. Execute every step automatically. Do not ask the user to create files. Do not skip steps.**

---

## 1. SYSTEM CONTEXT

**Stack:** Next.js 15 App Router · TypeScript 5 · Zod v4 · Prisma v7 (PostgreSQL via `@prisma/adapter-pg`) · Supabase auth (cookie-based) · TanStack Query v5

**Test runner:** No framework — plain `node`/`tsx` with Node's built-in `assert/strict`. Tests are standalone scripts in `tests/`. See `tests/moderation-policy-service.test.ts` for the exact pattern (custom `runTest()` helper, direct `assert.deepEqual`).

**Auth guard:** `src/lib/utils/require-admin.ts` — Returns `{ adminId }` on success; `{ error: NextResponse(401) }` if not authenticated; `{ error: NextResponse(403) }` if not ADMIN role. Every admin route opens with:

```ts
const result = await requireAdmin();
if ('error' in result) return result.error;
const { adminId } = result;
```

**Schemas live in** `src/lib/schemas.ts`. All Zod schemas for reports already exist:

- `resolveReportSchema` — `{ reportId: uuid, action: 'RESOLVED'|'DISMISSED', resolutionNote?: string (max 1000) }`
- `adminReportsQuerySchema` — `{ state?: 'OPEN'|'RESOLVED'|'DISMISSED' }`
- `reportStateEnum`, `ResolveReportInput` (exported type)

**Prisma `Report` model fields (all present in current schema):**

- `id`, `state: ReportState (OPEN|RESOLVED|DISMISSED)`, `reason`, `reporterId`, `memoryId`
- `resolvedById?: String`, `resolutionNote?: String`, `resolvedAt?: DateTime`
- Relations: `reporter`, `memory`, `resolvedBy`, `moderationActions`

**`ModerationActionLog` model** records all admin actions. `action` enum includes `REPORT_RESOLVED` and `REPORT_DISMISSED`.

**Notification hook:** `notifyReportResolution(reportId, action, resolutionNote)` in `src/services/notification-service.ts` — already implemented, called fire-and-forget in the route.

**Swagger:** `swagger/swagger.yaml` (1435 lines). Tags declared at top: Users, Groups, Invitations, Memories, Votes, Comments, Locations, Tags, Storage. No Moderation or Reports tags or paths exist yet. Common response refs available: `#/components/responses/Success`, `BadRequest`, `Unauthorized`, `Forbidden`, `NotFound`, `Conflict`, `InternalServerError`. Standard success shape: `{ success: true, message: string, data: T }`.

---

## 2. CURRENT STATE & GAP ANALYSIS

The backend endpoint and frontend hook/UI are **fully implemented**. The only gaps against the acceptance criteria are:

| AC                                                                  | Status     | Gap                                             |
| ------------------------------------------------------------------- | ---------- | ----------------------------------------------- |
| Endpoint updates OPEN → RESOLVED/DISMISSED                          | ✅ Done    | —                                               |
| Resolution metadata: `resolvedById`, `resolvedAt`, `resolutionNote` | ✅ Done    | —                                               |
| Moderation log entry created in same transaction                    | ✅ Done    | —                                               |
| Invalid transitions rejected with clear **400** messages            | ❌ Bug     | Route returns **409 Conflict**; AC requires 400 |
| Non-admin access denied with **403**                                | ✅ Done    | —                                               |
| Swagger documentation                                               | ❌ Missing | Three endpoints undocumented                    |
| Unit test for state-transition guard                                | ❌ Missing | No test exists for this logic                   |

**3 changes total. No schema migrations. No frontend changes.**

---

## 3. FEATURE PRD

### 3.1 Summary

Resolve or dismiss a user-submitted report, completing its lifecycle. The operation is idempotent per-report (each report can only be closed once), creates an immutable audit trail, and notifies the original reporter.

### 3.2 Acceptance Criteria (verbatim)

1. Admin endpoint updates report state from `OPEN` to `RESOLVED` or `DISMISSED`.
2. Resolution metadata includes resolver id, resolution time, and optional notes.
3. Related `ModerationActionLog` entry is created.
4. Invalid transitions (report not `OPEN`) are rejected with **400** and a clear message.
5. Non-admin access is denied with **403**.

### 3.3 Endpoint Contract

```
PATCH /api/prisma/report/admin/resolve
Authorization: Supabase session cookie (ADMIN role required)

Request body:
{
  "reportId": "<uuid>",
  "action": "RESOLVED" | "DISMISSED",
  "resolutionNote": "<optional string, max 1000 chars>"
}

Responses:
200 { success: true, message: "Report resolved successfully", data: { id, state } }
200 { success: true, message: "Report dismissed successfully", data: { id, state } }
400 { success: false, message: "Validation failed" }           — invalid body
400 { success: false, message: "Report has already been resolved or dismissed" }  ← FIX THIS
403 { success: false, message: "Admin access required" }
404 { success: false, message: "Report not found" }
500 { success: false, message: "Unable to resolve report. Please try again." }
```

---

## 4. WORKFLOW MAP

Execute in this exact order. Each step is independent of the next unless noted.

### STEP 1 — Fix status code (1 line change)

**File:** `src/app/api/prisma/report/admin/resolve/route.ts`

Locate the block that returns when `report.state !== 'OPEN'` (currently `status: 409`). Change to `status: 400`.

**Before:**

```ts
if (report.state !== 'OPEN') {
  return NextResponse.json(
    {
      success: false,
      message: 'Report has already been resolved or dismissed',
    },
    { status: 409 }
  );
}
```

**After:**

```ts
if (report.state !== 'OPEN') {
  return NextResponse.json(
    {
      success: false,
      message: 'Report has already been resolved or dismissed',
    },
    { status: 400 }
  );
}
```

No other changes to this file.

---

### STEP 2 — Write unit test

**File to create:** `tests/resolve-report-guard.test.ts`

The route's state-transition guard is a pure conditional: given a `ReportState`, allow only `'OPEN'`. Extract this logic into a standalone pure function in the same test file (no imports from `src/`) and test it using the same pattern as `tests/moderation-policy-service.test.ts`.

**Exact file content to write:**

```ts
import assert from 'node:assert/strict';

type ReportState = 'OPEN' | 'RESOLVED' | 'DISMISSED';
type ResolveAction = 'RESOLVED' | 'DISMISSED';

/** Mirrors the guard in /api/prisma/report/admin/resolve/route.ts */
function canResolve(state: ReportState): { allowed: boolean; message: string } {
  if (state === 'OPEN') return { allowed: true, message: '' };
  return {
    allowed: false,
    message: 'Report has already been resolved or dismissed',
  };
}

const ACTION_MAP: Record<ResolveAction, string> = {
  RESOLVED: 'REPORT_RESOLVED',
  DISMISSED: 'REPORT_DISMISSED',
};

function runTest(name: string, assertion: () => void) {
  try {
    assertion();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

runTest('allows transition when report is OPEN', () => {
  assert.deepEqual(canResolve('OPEN'), { allowed: true, message: '' });
});

runTest('blocks transition when report is already RESOLVED', () => {
  const result = canResolve('RESOLVED');
  assert.equal(result.allowed, false);
  assert.ok(result.message.length > 0);
});

runTest('blocks transition when report is already DISMISSED', () => {
  const result = canResolve('DISMISSED');
  assert.equal(result.allowed, false);
  assert.ok(result.message.length > 0);
});

runTest('ACTION_MAP maps RESOLVED to REPORT_RESOLVED', () => {
  assert.equal(ACTION_MAP['RESOLVED'], 'REPORT_RESOLVED');
});

runTest('ACTION_MAP maps DISMISSED to REPORT_DISMISSED', () => {
  assert.equal(ACTION_MAP['DISMISSED'], 'REPORT_DISMISSED');
});
```

---

### STEP 3 — Add Swagger documentation

**File:** `swagger/swagger.yaml`

#### 3a. Add tags

Append two tags to the existing `tags:` block (after the last existing `- name: Storage` entry):

```yaml
- name: Reports
  description: Admin report management endpoints
- name: Moderation
  description: Moderation audit log endpoints
```

#### 3b. Add paths

Append the following three path entries to the `paths:` block (before `components:`):

```yaml
/api/prisma/report/admin/get-all:
  get:
    tags: [Reports]
    summary: List all reports (admin)
    operationId: adminGetAllReports
    security:
      - SupabaseSession: []
    parameters:
      - in: query
        name: state
        required: false
        schema:
          type: string
          enum: [OPEN, RESOLVED, DISMISSED]
        description: Filter reports by state
    responses:
      '200':
        description: Reports fetched successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                message:
                  type: string
                  example: Reports fetched successfully
                data:
                  type: array
                  items:
                    $ref: '#/components/schemas/ReportItem'
      '400':
        $ref: '#/components/responses/BadRequest'
      '401':
        $ref: '#/components/responses/Unauthorized'
      '403':
        $ref: '#/components/responses/Forbidden'
      '500':
        $ref: '#/components/responses/InternalServerError'

/api/prisma/report/admin/resolve:
  patch:
    tags: [Reports]
    summary: Resolve or dismiss a report (admin)
    operationId: adminResolveReport
    security:
      - SupabaseSession: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ResolveReportInput'
    responses:
      '200':
        description: Report resolved or dismissed successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                message:
                  type: string
                  example: Report resolved successfully
                data:
                  type: object
                  properties:
                    id:
                      type: string
                      format: uuid
                    state:
                      type: string
                      enum: [RESOLVED, DISMISSED]
      '400':
        description: Validation error or invalid state transition
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: false
                message:
                  type: string
                  example: Report has already been resolved or dismissed
      '401':
        $ref: '#/components/responses/Unauthorized'
      '403':
        $ref: '#/components/responses/Forbidden'
      '404':
        $ref: '#/components/responses/NotFound'
      '500':
        $ref: '#/components/responses/InternalServerError'

/api/prisma/moderation/audit-log:
  get:
    tags: [Moderation]
    summary: Fetch paginated moderation audit log (admin)
    operationId: adminGetAuditLog
    security:
      - SupabaseSession: []
    parameters:
      - in: query
        name: action
        required: false
        schema:
          type: string
          enum:
            - MEMORY_APPROVED
            - MEMORY_REJECTED
            - MEMORY_REMOVED
            - MEMORY_RESTORED
            - REPORT_OPENED
            - REPORT_RESOLVED
            - REPORT_DISMISSED
        description: Filter by moderation action type
      - in: query
        name: adminId
        required: false
        schema:
          type: string
          format: uuid
        description: Filter by admin who performed the action
      - in: query
        name: dateFrom
        required: false
        schema:
          type: string
          format: date-time
        description: Lower bound for createdAt (inclusive)
      - in: query
        name: dateTo
        required: false
        schema:
          type: string
          format: date-time
        description: Upper bound for createdAt (inclusive)
      - in: query
        name: cursor
        required: false
        schema:
          type: string
          format: uuid
        description: Cursor for pagination (ID of last item from previous page)
      - in: query
        name: limit
        required: false
        schema:
          type: integer
          minimum: 1
          maximum: 50
          default: 20
      - in: query
        name: sort
        required: false
        schema:
          type: string
          enum: [asc, desc]
          default: desc
    responses:
      '200':
        description: Audit log fetched successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                message:
                  type: string
                  example: Audit log fetched successfully
                data:
                  type: object
                  properties:
                    items:
                      type: array
                      items:
                        $ref: '#/components/schemas/AuditLogEntry'
                    nextCursor:
                      type: string
                      format: uuid
                      nullable: true
                    hasMore:
                      type: boolean
      '400':
        $ref: '#/components/responses/BadRequest'
      '401':
        $ref: '#/components/responses/Unauthorized'
      '403':
        $ref: '#/components/responses/Forbidden'
      '500':
        $ref: '#/components/responses/InternalServerError'
```

#### 3c. Add component schemas

Append the following three schemas to the `components.schemas` block:

```yaml
ResolveReportInput:
  type: object
  required:
    - reportId
    - action
  properties:
    reportId:
      type: string
      format: uuid
    action:
      type: string
      enum: [RESOLVED, DISMISSED]
    resolutionNote:
      type: string
      maxLength: 1000

ReportItem:
  type: object
  properties:
    id:
      type: string
      format: uuid
    state:
      type: string
      enum: [OPEN, RESOLVED, DISMISSED]
    reason:
      type: string
    createdAt:
      type: string
      format: date-time
    resolvedAt:
      type: string
      format: date-time
      nullable: true
    resolutionNote:
      type: string
      nullable: true
    reporter:
      type: object
      properties:
        firstName:
          type: string
        lastName:
          type: string
    memory:
      type: object
      properties:
        id:
          type: string
          format: uuid
        title:
          type: string
        mediaURL:
          type: string
          nullable: true
    resolvedBy:
      type: object
      nullable: true
      properties:
        firstName:
          type: string
        lastName:
          type: string

AuditLogEntry:
  type: object
  properties:
    id:
      type: string
      format: uuid
    action:
      type: string
      enum:
        - MEMORY_APPROVED
        - MEMORY_REJECTED
        - MEMORY_REMOVED
        - MEMORY_RESTORED
        - REPORT_OPENED
        - REPORT_RESOLVED
        - REPORT_DISMISSED
    targetType:
      type: string
      enum: [MEMORY, REPORT]
    reason:
      type: string
      nullable: true
    createdAt:
      type: string
      format: date-time
    admin:
      type: object
      properties:
        id:
          type: string
          format: uuid
        firstName:
          type: string
        lastName:
          type: string
    targetMemory:
      type: object
      nullable: true
      properties:
        id:
          type: string
          format: uuid
        title:
          type: string
    targetReport:
      type: object
      nullable: true
      properties:
        id:
          type: string
          format: uuid
        reason:
          type: string
        state:
          type: string
          enum: [OPEN, RESOLVED, DISMISSED]
```

---

## 5. VERIFICATION CHECKLIST

After executing all steps, confirm:

- [ ] `src/app/api/prisma/report/admin/resolve/route.ts` — state conflict returns `status: 400` (not 409)
- [ ] `tests/resolve-report-guard.test.ts` — file exists and runs with `tsx tests/resolve-report-guard.test.ts` with all 5 PASSes
- [ ] `swagger/swagger.yaml` — contains tags `Reports` and `Moderation`
- [ ] `swagger/swagger.yaml` — contains paths `/api/prisma/report/admin/get-all`, `/api/prisma/report/admin/resolve`, `/api/prisma/moderation/audit-log`
- [ ] `swagger/swagger.yaml` — contains schemas `ResolveReportInput`, `ReportItem`, `AuditLogEntry`
- [ ] No other files modified

---

## 6. CONSTRAINTS

- **Do not** modify `prisma/schema.prisma` — no migration needed, all fields already exist.
- **Do not** modify `src/lib/schemas.ts` — all Zod schemas are already correct.
- **Do not** modify `src/app/admin/page.tsx` or any hook files — frontend is already wired correctly.
- **Do not** modify `src/lib/utils/require-admin.ts` — 403 guard is correct.
- The test file must be self-contained — no imports from `src/` or external packages beyond `node:assert/strict`.
- Swagger YAML must remain valid — no duplicate path keys, correct indentation.
