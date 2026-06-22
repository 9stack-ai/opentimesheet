# Code Standards — 9stimesheet

---

## Naming Conventions

### Files & Directories
- **TypeScript/JavaScript:** kebab-case for files (e.g., `work-session.ts`, `data-table.tsx`)
- **Folders:** lowercase, descriptive (e.g., `app/(app)/manager/`, `components/data-table/`)
- **Routes:** kebab-case in `app/` (e.g., `/manager/approvals`, `/admin/audit`)
- **Test files:** `*.test.ts` colocated with source (e.g., `lib/payroll.test.ts`)

### Variables & Functions
- **camelCase** for variables, functions, and methods
- **PascalCase** for React components and classes
- **UPPERCASE_SNAKE_CASE** for constants (rarely used; prefer `const` with camelCase)

**Examples:**
```typescript
// Variables
const timeEntryStatus = "SUBMITTED";
const costRateBps = 1000;

// Functions
function resolveCostRate(assignment: Assignment, user: User): number { ... }

// Components
export function TimeEntryTable({ entries }: Props) { ... }
export const SubmitButton = React.forwardRef<...>(...)

// Constants
const ROLES = ["ADMIN", "MANAGER", "EMPLOYEE", "FREELANCER"] as const;
```

### Database & Fields
- **Fields:** camelCase (e.g., `costRateSnapshot`, `redmineProjectId`)
- **Table names:** PascalCase in Prisma schema (mapped to snake_case in DB by default)
- **Enums:** Values UPPERCASE_SNAKE_CASE (e.g., `"DRAFT" | "SUBMITTED" | "APPROVED"`)

**Prisma Example:**
```prisma
model TimeEntry {
  id String @id
  status String @default("DRAFT") // "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED"
  costRateSnapshot Int?
  redminePushStatus String @default("pending")
}
```

---

## Server Actions & Mutations

### File Structure
- Each route with forms has `actions.ts` (e.g., `app/(app)/timesheet/actions.ts`)
- Server functions marked with `"use server"`
- Validate inputs with Zod schemas from `lib/validation.ts`
- Check RBAC via `requireUser()`, `requireManager()`, `requireRole()`
- Record mutations in audit log via `recordAudit()`

### Pattern
```typescript
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { zCreateTimeEntrySchema } from "@/lib/validation";
import { requireUser } from "@/lib/rbac";

export async function createTimeEntry(data: unknown) {
  const session = await auth();
  requireUser(session?.user);

  const validated = zCreateTimeEntrySchema.parse(data);

  const entry = await prisma.timeEntry.create({
    data: {
      userId: session.user.id,
      taskId: validated.taskId,
      date: new Date(validated.date),
      hours: validated.hours,
      status: "DRAFT",
      // Snapshot rates at creation (defensive; not frozen until approval)
      costRateSnapshot: computedRate,
    },
  });

  await recordAudit(
    "timeentry.create",
    `Created time entry: ${validated.hours}h on task ${validated.taskId}`,
    "TimeEntry",
    entry.id
  );

  return { success: true, id: entry.id };
}
```

### Error Handling
- Use Zod `parse()` to throw on invalid input (caught by browser error boundary)
- Return `{ success: false, error: "message" }` for expected errors (e.g., missing data)
- Wrap in try-catch if external dependencies may fail (Redmine API)

### Multi-Submit Prevention
- Use `SubmitButton` component (wraps native button, uses `useFormStatus` hook to disable on pending)
- Never allow server action to run twice concurrently from the same form

---

## Validation

### Zod Schemas
- Centralize all schemas in `lib/validation.ts`
- Name schemas with `z` prefix and domain suffix (e.g., `zCreateTimeEntrySchema`, `zUpdateProjectSchema`)
- Use `z.object()` for input structs; chain `.parse()` or `.safeParse()` in server actions

**Example:**
```typescript
export const zCreateTimeEntrySchema = z.object({
  taskId: z.string().cuid(),
  date: z.string().date(), // ISO 8601
  hours: z.number().min(0.25).max(8), // 15 min increments
  note: z.string().max(500).optional(),
});

export const zUpdateTimeEntrySchema = zCreateTimeEntrySchema.partial().extend({
  id: z.string().cuid(),
});
```

### Validation at Boundaries
- **Form inputs:** Zod in server actions
- **Database writes:** Prisma schema constraints (unique, required, enums)
- **Date handling:** Enforce UTC-midnight for calendar dates via `toDateOnly(date)` helper
- **Money:** Assert integer VND via `toVndInt(amount)` before DB write

---

## Money & Numeric Precision

### Invariant
- **Money:** Integer VND (đồng) — no fractional units
- **Hours:** Float (Decimal(5,2) in schema) — stored as floating point
- **Tax/Insurance:** Integer basis points (bps; 1000 = 10%)

### Operations
```typescript
import { formatVnd, parseVnd, toVndInt } from "@/lib/money";

// Format for display
console.log(formatVnd(1234567)); // "1.234.567 ₫"

// Parse user input
const input = "1.234.567 ₫";
const amount = parseVnd(input); // 1234567

// Compute and assert integer
const grossPay = hours * costRate; // may be float
const netPay = toVndInt(Math.trunc(grossPay - tax)); // assert integer

// Tax computation
const taxRate = 1000; // bps (10%)
const tax = Math.trunc((gross * taxRate) / 10000); // integer
```

### Rounding Strategy
- **At entry creation:** No rounding (capture actual value)
- **At approval:** Snapshot rates; round totals to integer VND if needed (largest-remainder for allocations)
- **At display:** Use `formatVnd()` for user output; never show fractional dong
- **Historical reports:** Always use snapshots; never recompute from live rates

---

## Periods & Dates

### Date Storage
- **UTC-midnight:** All dates stored as UTC midnight (00:00:00 UTC)
- **Type:** Prisma `DateTime` for precise timestamps; `@db.Date` for calendar-only dates
- **Mapping:** `Date` in JavaScript ↔️ calendar date in DB

### Period Arithmetic
```typescript
import { monthPeriod, monthPeriodOf, formatISODate, toDateOnly } from "@/lib/period";

// Get period for a specific month
const jan2026 = monthPeriod(2026, 1); // Jan 2026
console.log(jan2026.start); // 2026-01-01 00:00 UTC
console.log(jan2026.end); // 2026-02-01 00:00 UTC (exclusive)

// Get period of a date
const period = monthPeriodOf(new Date());

// Query with period boundaries
const entries = await prisma.timeEntry.findMany({
  where: {
    date: { gte: period.start, lt: period.end },
  },
});

// Format for API/display
const label = formatISODate(period.start); // "2026-01-01"
```

### Timezone
- **Storage:** UTC-midnight (no timezone info in DB)
- **Display:** Asia/Saigon (UTC+7, no DST) via `lib/clock.ts`
- **Helpers:** `nowSaigon()`, `now()` for current time

---

## RBAC & Auth

### Guards
```typescript
import { requireUser, requireManager, requireRole } from "@/lib/rbac";

// Ensure authenticated
requireUser(user); // throws 401 if falsy

// Ensure manager-level permission
requireManager(user.role); // throws 403 if not ADMIN|MANAGER

// Ensure specific role
requireRole(user.role, ["ADMIN"]); // throws 403 if not in list
```

### Admin On-Behalf
- Only `ADMIN` role can pass `?userId=otherUserId`
- On timesheet page, conditionally show "logging for [name]"
- Audit log captures both acting admin (`actorId`) and target user (`targetId`)

```typescript
export async function createTimeEntryOnBehalf(userId: string, data: unknown) {
  const session = await auth();
  requireRole(session?.user?.role, ["ADMIN"]);

  // Proceed with userId instead of session.user.id
  const entry = await prisma.timeEntry.create({
    data: { userId, ...validated },
  });

  await recordAudit(
    "timeentry.create_on_behalf",
    `Admin created entry for ${userId}`,
    "TimeEntry",
    entry.id,
    { targetId: userId }
  );
}
```

---

## Audit & Logging

### Pattern
```typescript
import { recordAudit } from "@/lib/audit";

await recordAudit(
  action, // machine code, e.g. "timeentry.approve"
  summary, // human-readable Vietnamese, e.g. "Duyệt chấm công 8 giờ"
  targetType, // model name, e.g. "TimeEntry"
  targetId, // target PK, e.g. entryId
  extraContext // optional { targetId, actorRole } for admin on-behalf
);
```

### Coverage
- All mutations (create, update, delete, approve, reject)
- Sensitive reads (export data, view detailed financials) — optional but recommended
- Best-effort; failure to record does not roll back the mutation

---

## Components & UI

### Button Submission
- Use `SubmitButton` from `@/components/ui/submit-button` to prevent multi-submit
- It wraps native button and uses `useFormStatus` hook (automatically disabled while form is pending)

```typescript
import { SubmitButton } from "@/components/ui/submit-button";
import { useFormState } from "react-dom";
import { approveTimeEntry } from "./actions";

export function ApproveButton({ entryId }: { entryId: string }) {
  const [state, formAction] = useFormState(approveTimeEntry, null);

  return (
    <form action={formAction}>
      <input type="hidden" name="entryId" value={entryId} />
      <SubmitButton>Approve</SubmitButton>
      {state?.error && <p className="text-red-600">{state.error}</p>}
    </form>
  );
}
```

### Data Tables
- Use `TanStack Table` (`@tanstack/react-table`) for sorting, filtering, pagination
- Keep column definitions in separate `*-columns.tsx` files
- Render with shadcn `DataTable` wrapper component

**Example:** `app/(app)/timesheet/entries-columns.tsx`

### Charts & Reporting
- Use Recharts for charts (bar, line, pie)
- Keep chart components small; move data logic to RSC page or lib functions
- Ensure accessible labels and keyboard navigation

---

## Database Patterns

### Queries
- Use Prisma Client (via `lib/db.ts`)
- Always select necessary fields (avoid `select: { * }`)
- Use `include` for relations when needed, but fetch sparingly

```typescript
// Good: Select specific fields
const entries = await prisma.timeEntry.findMany({
  where: { userId, status: "APPROVED" },
  select: {
    id: true,
    date: true,
    hours: true,
    costRateSnapshot: true,
  },
});

// Less efficient: Brings back all fields
const entries = await prisma.timeEntry.findMany({
  where: { userId, status: "APPROVED" },
});
```

### Mutations
- Use `create`, `update`, `delete`, `deleteMany` (idempotent if used with proper where clauses)
- Always wrap in transaction if multiple models are affected

```typescript
// Transaction for related updates
const result = await prisma.$transaction(async (tx) => {
  const entry = await tx.timeEntry.update({
    where: { id: entryId },
    data: { status: "APPROVED", costRateSnapshot: rate },
  });

  // If approval triggers other changes (e.g., update project balance)
  await tx.project.update({
    where: { id: entry.taskId }, // pseudocode; adjust as needed
    data: { ...updated },
  });

  return entry;
});
```

### Indexes
- Defined in schema (e.g., `@@index([userId, date])`)
- Applied on next migration/db push
- Review slow queries via Postgres logs or `EXPLAIN ANALYZE`

### Schema Parity
- Keep `prisma/schema.prisma` (dev/SQLite) and `prisma/schema.prod.prisma` (prod/PostgreSQL) in sync
- Run `pnpm test` before commit; `lib/schema-parity.test.ts` enforces matching fields
- If schemas diverge, test fails; must fix before merging

---

## Testing

### Unit Tests (Vitest)
- **Location:** `lib/**/*.test.ts`
- **Focus:** Pure functions (no database)
- **Example:** `lib/payroll.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { computeNetPay } from "@/lib/payroll";

describe("payroll", () => {
  it("should compute net pay with tax deduction", () => {
    const gross = 10000000; // 10M VND
    const taxRateBps = 1000; // 10%
    const net = computeNetPay(gross, taxRateBps);
    expect(net).toBe(9000000); // 9M
  });
});
```

### E2E Tests (Playwright)
- **Location:** `e2e/` (stub; not yet comprehensive)
- **Run:** `pnpm e2e`
- **Focus:** Critical user journeys (login, submit time entry, approve)

### Database Tests
- Avoided in unit suite (would slow down CI)
- Covered by manual QA and E2E tests
- For testing DB-bound logic, write a small standalone script (not in test suite)

### Running Tests
```bash
pnpm test              # Run once
pnpm test:watch       # Watch mode
pnpm e2e              # E2E tests
```

---

## Common Patterns

### Handling Money in Reports
```typescript
import { formatVnd } from "@/lib/money";
import { computeNetPay } from "@/lib/payroll";

const grossPay = approvedHours * costRateSnapshot;
const taxAmount = (grossPay * taxRateSnapshot) / 10000;
const netPay = toVndInt(grossPay - taxAmount);

return {
  gross: formatVnd(grossPay),
  tax: formatVnd(taxAmount),
  net: formatVnd(netPay),
};
```

### Fetching Period-Filtered Data
```typescript
import { monthPeriodOf } from "@/lib/period";

const period = monthPeriodOf(new Date());
const entries = await prisma.timeEntry.findMany({
  where: {
    userId,
    status: "APPROVED",
    date: { gte: period.start, lt: period.end },
  },
  select: { hours: true, costRateSnapshot: true },
});
```

### Handling Redmine Sync
```typescript
// Best-effort: catch errors, don't fail the main operation
try {
  await pushToRedmine(entryId);
  await recordAudit("timeentry.redmine_push", "Pushed to Redmine", ...);
} catch (error) {
  await prisma.timeEntry.update({
    where: { id: entryId },
    data: {
      redminePushStatus: "failed",
      redminePushError: error.message,
    },
  });
  // Log but don't throw
  console.error("Redmine push failed:", error);
}
```

---

## Commit Message Format

Use Conventional Commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type:** `feat`, `fix`, `refactor`, `test`, `docs`, `style`, `chore`, `ci`

**Scope:** Feature or module (e.g., `timesheet`, `payroll`, `redmine`, `ui`)

**Examples:**
```
feat(timesheet): add work-session live timer

fix(payroll): correct employer-cost rate calculation

refactor(reporting): extract period-filtering logic to lib

docs: update README with quickstart

test: add schema-parity test for prod schema

ci: configure playwright e2e runner
```

**Never:**
- Reference issue/PR numbers (not tracked here)
- Include internal task IDs or Jira keys
- Use "update", "change", "fix" without context

---

## Style & Formatting

### TypeScript
- Use strict mode (`strict: true` in `tsconfig.json`)
- Prefer `const` over `let`; avoid `var`
- Use type annotations on public APIs; infer internally
- No `any` types; use `unknown` if needed, then narrow

### React
- Prefer functional components
- Use React hooks (useState, useEffect, useCallback, etc.)
- Keep components small; extract logic to custom hooks or lib functions
- Props as single object parameter (destructure if needed)

### Imports
- Absolute imports using `@/` alias (configured in `tsconfig.json`)
- Group: external libs, then app code, then relative (blank line between groups)

```typescript
import React, { useState } from "react";
import { TanStackTable } from "@tanstack/react-table";

import { prisma } from "@/lib/db";
import { TimeEntry } from "@/lib/types";

import { SubmitButton } from "./submit-button";
```

### Linting
- Run `pnpm lint` before committing
- ESLint config (`.eslintrc`) enforces Next.js best practices
- Fix automatically: `pnpm lint --fix`

---

## Error Handling

### Server Actions
```typescript
export async function submitTimeEntry(entryId: string) {
  try {
    const session = await auth();
    requireUser(session?.user);

    const entry = await prisma.timeEntry.update({
      where: { id: entryId },
      data: { status: "SUBMITTED" },
    });

    return { success: true, data: entry };
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    if (error instanceof PrismaClientKnownRequestError) {
      return { success: false, error: "Database error" };
    }
    throw error; // Let top-level error handler catch it
  }
}
```

### Components
- Use error boundaries (shadcn/ui provides one)
- Show user-friendly toast messages via Sonner (`toast.error()`)
- Log technical details to console for debugging

---

## Performance Considerations

### Database
- Use indexes for frequently filtered/sorted fields (defined in schema)
- Fetch only needed columns via `select` in Prisma queries
- Avoid N+1: use `include` or batch queries
- Pagination for large tables (default 50 rows per page in DataTable)

### Frontend
- Code split route components (Next.js does this automatically)
- Lazy-load charts and tables if below fold
- Use `React.memo` for expensive components (rare; Vite is usually fast enough)

### Build
- `pnpm build` generates optimized Next.js build
- Checked in CI before merge
- Dockerfile multi-stage build minimizes image size

---

## Documentation

### Code Comments
- Avoid obvious comments ("// increment i")
- Explain **why**, not what; the code shows the what
- Use JSDoc for public functions

```typescript
/**
 * Compute net pay after PIT withholding.
 * @param gross - Gross pay in integer VND
 * @param taxRateBps - Tax rate in basis points (1000 = 10%)
 * @returns Net pay in integer VND
 */
export function computeNetPay(gross: number, taxRateBps: number): number {
  const tax = Math.trunc((gross * taxRateBps) / 10000);
  return gross - tax;
}
```

### File Headers
- No file-level comments required
- Prisma schema files include a brief comment at the top

### README & Docs
- Keep `README.md` under 300 lines (detailed docs in `docs/`)
- Update docs when user-facing behavior, API, or architecture changes
- Link between doc files using relative paths

---

## File Organization

```
app/
  (app)/
    layout.tsx              # Auth middleware, nav
    page.tsx                # Dashboard
    timesheet/
      page.tsx              # Main timesheet view
      actions.ts            # Server actions
      *-columns.tsx         # Table columns
      *-table.tsx           # Table component
      work-session-card.tsx # Component
  login/
  set-password/

components/
  ui/                       # Reusable UI (button, input, etc.)
  data-table/              # DataTable component
  reports/                 # Report-specific components

lib/
  *.ts                      # Business logic (no Prisma deps on critical path)
  *.test.ts                 # Unit tests
  db.ts                     # Prisma singleton

prisma/
  schema.prisma             # Dev schema (SQLite)
  schema.prod.prisma        # Prod schema (PostgreSQL)
  seed.ts                   # Dev data
  migrations/               # Auto-generated

docs/
  *.md                      # All documentation

e2e/
  *.spec.ts                 # Playwright tests

scripts/
  *.ts                      # Utility scripts (bootstrap, etc.)
```

---

## Before Committing

- [ ] Run `pnpm test` — all unit tests pass
- [ ] Run `pnpm lint` — no linting errors (fix with `--fix` if needed)
- [ ] Run `pnpm build` — production build succeeds
- [ ] Check schema parity: `lib/schema-parity.test.ts` passes
- [ ] Audit logs recorded for mutations
- [ ] `README.md` or `docs/*.md` updated if user-facing behavior changed
- [ ] Commit message follows Conventional Commits format
- [ ] No secrets, `.env` files, or credentials in diff

---

## Useful Commands

```bash
# Development
pnpm dev                   # Start dev server
pnpm db:studio            # Open Prisma Studio GUI
pnpm db:seed              # Reset and seed dev data

# Quality checks
pnpm test                 # Unit tests
pnpm test:watch          # Watch mode
pnpm lint                # ESLint
pnpm build               # Production build
pnpm e2e                 # E2E tests

# Database
pnpm db:generate         # Regenerate Prisma client (after schema change)
pnpm db:migrate          # Create and apply migrations
pnpm db:push             # Push schema changes (caution: destructive in prod)
```
