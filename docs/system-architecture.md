# System Architecture — 9stimesheet

---

## High-Level Layers

```mermaid
graph TD
    A["RSC Pages<br/>(app/(app)/**/page.tsx)"]
    B["Server Actions<br/>(actions.ts per route)"]
    C["Business Logic<br/>(lib/*.ts)<br/>Payroll, Reporting, RBAC, Audit"]
    D["Prisma ORM<br/>(lib/db.ts)"]
    E["Database Adapter<br/>SQLite Dev / PostgreSQL Prod"]
    F["Database<br/>13 models"]

    A -->|fetch data| C
    A -->|form submit| B
    B -->|validate| C
    C -->|query/mutate| D
    D -->|SQL| E
    E -->|read/write| F

    style A fill:#e1f5ff
    style B fill:#fff3e0
    style C fill:#f3e5f5
    style D fill:#e8f5e9
    style E fill:#fce4ec
    style F fill:#f1f8e9
```

**RSC Pages** render server-side, fetch data safely behind auth. **Server Actions** handle mutations with Zod validation. **Lib** contains pure domain logic (rates, payroll, period math, audit). **Prisma ORM** abstracts the database; the adapter (SQLite or PostgreSQL) is chosen at runtime from `DATABASE_URL`.

---

## Dual Adapter Strategy

| Aspect | Development | Production |
|--------|-------------|-----------|
| **Database** | SQLite 3 (file-based) | PostgreSQL 17 (managed) |
| **Driver** | `@prisma/adapter-better-sqlite3` | `@prisma/adapter-pg` |
| **URL Scheme** | `file:./dev.db` | `postgres://user:pass@host/db` |
| **Selection** | Runtime check in `lib/db.ts` | Environment variable at startup |
| **Schema File** | `prisma/schema.prisma` | `prisma/schema.prod.prisma` |
| **Parity** | Enforced by `lib/schema-parity.test.ts` | Enforced by `lib/schema-parity.test.ts` |

`lib/db.ts` inspects `DATABASE_URL` scheme:
- If `file:` or relative path → **SQLite**
- If `postgres://` or `postgresql://` → **PostgreSQL**

This allows the same build to run in both environments without code changes. Schema files must remain field-for-field identical (column names, types, constraints); test catches divergence.

---

## Data Models (13 total)

### User
- **Roles:** `ADMIN | MANAGER | EMPLOYEE | FREELANCER`
- **Rates:** `defaultCostRate`, `defaultBillableRate` (VND/hour)
- **Tax:** `taxWithholdingRateBps`, `employerCostRateBps` (basis points; 1000 = 10%)
- **Redmine:** Encrypted API key, user ID, connection timestamp
- **Relations:** assignments, timeEntries, disbursements, workSession, inviteToken

### TimeEntry
- **Status:** `DRAFT | SUBMITTED | APPROVED | REJECTED`
- **Data:** `userId`, `taskId`, `date`, `hours` (Float), `note`
- **Snapshots:** Rate snapshots frozen at approval for historical accuracy:
  - `costRateSnapshot`, `billableRateSnapshot` (VND/hour)
  - `taxRateSnapshot`, `employerCostRateSnapshot` (basis points)
- **Approval:** `approvedById`, `approvedAt`, `rejectReason`
- **Redmine:** `redmineTimeEntryId`, `redminePushStatus` (pending/pushing/pushed/failed/skipped), push error tracking
- **Indexes:** `[userId, date]`, `[status, date]`, `[redminePushStatus]` for query performance

### Project
- **Relations:** Client, Tasks, Assignments, Expenses, Income
- **Status:** `ACTIVE | ARCHIVED`
- **Redmine:** Optional `redmineProjectId` for Redmine sync
- **Dates:** Optional `startDate`, `endDate` for project lifecycle

### Task
- **Source:** `LOCAL | REDMINE` (indicates origin)
- **Redmine Fields:** `redmineIssueId`, `redmineUpdatedOn`, `redmineClosed`, `syncedAt`
- **Constraint:** `@@unique([projectId, redmineIssueId])` — one app Task per Redmine issue per project

### Assignment
- **Purpose:** Per-project rate override for a user
- **Data:** `projectId`, `userId`, `costRateOverride`, `billableRateOverride` (nullable; if null, use user defaults)
- **Constraint:** `@@unique([projectId, userId])` — one assignment per user per project

### Expense
- **Kind:** `REGULAR | IRREGULAR` (irregular = chi bất thường, unexpected expense)
- **Scope:** Optional `projectId` (null = company-level overhead)
- **Tracking:** Amount, date, category, note, logged-by user

### Income
- **Source:** Free-text (e.g., "client billing", "capital injection", "interest")
- **Scope:** Optional `projectId` (null = company-level revenue)
- **Timing:** Optional date (may be entered retroactively)

### Disbursement
- **Purpose:** Record actual cash paid to a person (thực chi — distinct from TimeEntry-derived payout)
- **Scope:** Per user, per salary period (`periodLabel` = "YYYY-MM")
- **Data:** Amount (VND), payment date, notes
- **Indexing:** `[periodLabel]` for period-filtered reconciliation

### WorkSession
- **Purpose:** Live timer state per user
- **Constraint:** `@@unique([userId])` — max 1 open session per user
- **Data:** `startedAt` (when timer began), `createdAt` (when row inserted)
- **Lifecycle:** On End, create DRAFT TimeEntry from elapsed hours (≥1 min, max 4h); delete WorkSession row

### FixedCost
- **Purpose:** Monthly recurring operating expenses
- **Data:** `name`, `category`, `monthlyAmount` (VND), `effectiveFrom`, `effectiveTo` (optional)
- **Usage:** Allocated to projects by hours worked (largest-remainder method) for profitability reports

### AuditLog
- **Purpose:** Denormalized audit trail (survives actor deletion)
- **Data:** `actorId` (nullable), `actorName`, `actorRole` (denormalized), `action` (machine code), `summary` (Vietnamese), `targetType`, `targetId`
- **Indexing:** `[createdAt]`, `[actorId]` for query performance

### InviteToken
- **Purpose:** Secure password-set flow for invited users
- **Data:** `userId`, `selector` (public lookup key), `tokenHash` (bcrypt), `expiresAt`, `usedAt` (null until redeemed)
- **Constraint:** `@unique([userId])`, `@unique([selector])` — one active token per user

---

## Request Flow: Time Entry Approval

```
User submits TimeEntry (DRAFT → SUBMITTED)
    ↓
[Server Action] validateAndSubmit(entryId)
    ↓ (Zod validation)
[Lib] RBAC check — requireUser(user)
    ↓ (may check manager-only actions)
[Lib] recordAudit("timeentry.submit", ...)
    ↓
[Prisma] await prisma.timeEntry.update({
    where: { id: entryId },
    data: {
      status: "SUBMITTED",
      costRateSnapshot: computed rate,
      taxRateSnapshot: computed tax,
    }
  })
    ↓
[PostgreSQL / SQLite] UPDATE time_entry SET status = 'SUBMITTED', ...
    ↓
Return to RSC page, page re-fetches data
    ↓
DataTable refreshed; toast notification (Sonner)
```

Manager approves → same pattern, but:
- `requireManager()` guards
- Snapshots frozen if not already (defensive)
- If `redminePushStatus === "pending"`, async background job queues Redmine push (stub for now)
- Audit log: "timeentry.approve"

---

## Rate Resolution & Snapshots

### Effective Rate (at entry creation)
```
costRate = Assignment.costRateOverride ?? User.defaultCostRate
billableRate = Assignment.billableRateOverride ?? User.defaultBillableRate
taxRate = User.taxWithholdingRateBps
employerCostRate = User.employerCostRateBps
```

### Snapshot (frozen at approval)
When a TimeEntry transitions to APPROVED:
- Compute effective rate (as above)
- Store in `costRateSnapshot`, `billableRateSnapshot`, etc.
- **All downstream reports use snapshots, never live rates**
- This ensures historical payout/billing is stable even if rates change later

### Historical Accuracy
- Payout report for past month uses TimeEntries with `status === "APPROVED"` filtered by date and snapshot values
- Snapshots mean re-running a report for a closed month yields identical results

---

## Period Calculation

**Type:** `PeriodKind = "week" | "month" | "quarter" | "half" | "year" | "all"`

**Invariant:** Boundaries are [start, end) — **start inclusive, end exclusive**.

**Timezone:** All dates stored as UTC-midnight (matching Prisma `@db.Date` round-trip). Display timezone is Asia/Saigon (UTC+7, no DST) via `lib/clock.ts`:
- `nowSaigon()` — current time in Saigon timezone
- `now()` — current UTC time

**Examples:**
- Month period for Jan 2026: `start = 2026-01-01 00:00 UTC`, `end = 2026-02-01 00:00 UTC`
- Query: `WHERE date >= start AND date < end` ✓

---

## Auth & RBAC

### Credentials Flow (Auth.js v5 Beta)
1. User enters email + password on login form
2. Server Action validates against User (bcrypt hash)
3. Auth.js creates secure session cookie
4. `proxy.ts` (Next.js 16's renamed middleware) + the `authorized` callback in `auth.config.ts` guard requests
5. RSC pages/layouts call `requireUser()` / `requireManager()` (`lib/rbac.ts`) to get & gate the current user

### Role Guards (lib/rbac.ts)

```typescript
// Throws 401 if not authenticated
requireUser(session.user)

// Throws 403 if not ADMIN or MANAGER
requireManager(session.user.role)

// Throws 403 if role not in allowed list
requireRole(session.user.role, ["ADMIN", "MANAGER"])
```

### Admin On-Behalf
- Only ADMIN can set `?userId=otherUserId` on `/timesheet`
- Timesheet UI changes to show "logging for [name]"
- Audit log records acting admin and target user separately

---

## Business Logic Modules

| Module | Purpose |
|--------|---------|
| `period.ts` | Calendar-based period math (week/month/quarter/half/year/all); helper functions for shifting periods |
| `payroll.ts` | Compute gross, withheld tax, net pay; apply PIT + employer insurance snapshots |
| `reporting.ts` | High-level report interfaces (payoutByUser, billingByClient, etc.) |
| `reporting-db.ts` | Fetch and aggregate from DB (queries grouped by user/client/project) |
| `profitability.ts` | Allocate fixed costs to projects by hours worked using largest-remainder method |
| `finance-overview.ts` | Cash model: actualNet = income − disbursed − operating expenses; projectedNet subtracts unpaid payroll |
| `dashboard.ts` | Manager KPI cards (income, expenses, net, payroll debt) |
| `rates.ts` & `rates-resolve.ts` | Resolve effective rate for a user on a project; fallback chain (assignment override → user default) |
| `audit.ts` | `recordAudit(action, summary, target)` — denormalized audit trail |
| `work-session.ts` | Compute hours from start/end timestamps; apply 15-min rounding, max 4h per session |
| `crypto.ts` | AES-256-GCM encryption/decryption for Redmine API keys at rest |
| `validation.ts` | Zod schemas for mutations (create/update/delete) |
| `money.ts` | Format integer VND, parse user input, assert integer type |
| `rbac.ts` | Role-based access control guards |
| `roles.ts` | Role type definitions (no Prisma imports, usable in edge middleware) |
| `clock.ts` | Asia/Saigon timezone helpers (`nowSaigon()`, `now()`) |
| `db.ts` | Prisma client singleton with runtime adapter selection |

---

## Server Actions Pattern

Each route with forms has an `actions.ts` file:

```typescript
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { zTimeEntrySchema } from "@/lib/validation";
import { requireUser } from "@/lib/rbac";

export async function submitTimeEntry(entryId: string) {
  const session = await auth();
  requireUser(session?.user);

  const validation = await zTimeEntrySchema.parseAsync(data);
  if (!validation.success) {
    return { error: validation.error.message };
  }

  const entry = await prisma.timeEntry.update({
    where: { id: entryId },
    data: { status: "SUBMITTED" }
  });

  await recordAudit("timeentry.submit", `Submitted entry for ${entry.hours}h`, "TimeEntry", entryId);

  return { success: true, entry };
}
```

**Conventions:**
- Always start with `"use server"` directive
- Validate with Zod (`parseAsync` or `safeParse`)
- Use `requireUser()` / `requireManager()` guards
- Call `recordAudit()` after mutations
- Return `{ success, error, data }` objects
- Prevent multi-submit via `SubmitButton` component (useFormStatus hook)

---

## Testing Strategy

### Unit Tests (Vitest)
- **Location:** `lib/**/*.test.ts` (10 test files total)
- **Focus:** Pure functions (period math, payroll, reporting, money formatting)
- **Isolation:** No live database; mocking where needed
- **Coverage:** ≥80% for critical paths

**Examples:**
- `period.test.ts` — Period boundary calculations
- `payroll.test.ts` — Tax and employer cost computation
- `profitability.test.ts` — Fixed-cost allocation
- `rates.test.ts` — Rate resolution and overrides
- `schema-parity.test.ts` — Ensures SQLite schema matches PostgreSQL schema

### E2E Tests (Playwright)
- **Location:** `e2e/` (stub config in `playwright.config.ts`)
- **Focus:** User workflows (login, submit time entry, approve, view reports)
- **Requirements:** Live running app + browser automation

### Database Tests
- Avoided in unit suite (too slow, requires schema)
- Covered by manual QA and E2E tests

---

## Monitoring & Observability

### Audit Trail
- Every mutation recorded in `AuditLog` table
- Queryable by action, actor, target, date
- Admin UI at `/admin/audit`

### Error Logs
- `lib/db.ts` configures Prisma to log errors + warnings in dev, errors only in prod
- App errors logged to console; could integrate with Sentry (not yet configured)

### Redmine Sync Status
- `TimeEntry.redminePushStatus` tracks async push state
- `TimeEntry.redminePushError` stores error message (human-readable)
- Manager UI allows manual retry

---

## Deployment & Runtime

### Docker Build
```dockerfile
# Multi-stage build
FROM node:18 AS builder
WORKDIR /app
COPY . .
RUN pnpm install && pnpm build

FROM node:18
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["node_modules/.bin/next", "start"]
```

### Environment Variables (Production)
```bash
DATABASE_URL=postgresql://user:pass@db:5432/9stimesheet
AUTH_SECRET=<32-byte random>
AUTH_URL=https://timesheet.9stack.vn
ADMIN_EMAIL=admin@9stack.vn
ADMIN_NAME=Admin
ADMIN_PASSWORD=<initial password>
REDMINE_URL=https://redmine.example.com  # optional
REDMINE_ENC_KEY=<base64 32-byte>          # optional
```

### Runtime Adapter Selection
At startup, Prisma reads `DATABASE_URL`:
- Dev: `file:./dev.db` → SQLite adapter
- Prod: `postgresql://...` → PostgreSQL adapter
- Same Next.js build runs in both

---

## Data Flow: Report Generation

### Finance Report (`/manager/reports/finance`)

```
User navigates to /manager/reports/finance?period=month&year=2026&month=1
    ↓
RSC page calls lib/finance-overview.ts:managerKpis()
    ↓
managerKpis fetches:
  - TimeEntry (APPROVED, date in period) → sum costRateSnapshot * hours
  - Income (in period) → sum amount
  - Expense (in period, including fixed-cost accrual) → sum amount
  - Disbursement (periodLabel matches) → sum amount
    ↓
Compute:
  - Payroll cost = sum of approved time entries
  - Employer insurance = Payroll cost × employerCostRateBps / 10000
  - actualNet = Income − Disbursed − Operating Expenses
  - projectedNet = actualNet − unpaidPayroll − employerInsurance
    ↓
Render cards + chart (Recharts)
    ↓
CSV export via /api/reports/finance/export route
```

---

## Security Considerations

### Authentication
- Credentials hashed with bcrypt (cost 12)
- Session cookies secure, HttpOnly, SameSite=Lax
- Middleware enforces auth on all `/(app)/*` routes

### Authorization
- Every server action checks `requireUser()` / `requireManager()`
- No SQL injection (Prisma parameterizes all queries)
- CSRF protected by Next.js framework

### Data Protection
- Redmine API keys encrypted at rest (AES-256-GCM)
- Audit trail captures mutations but not sensitive details
- Backups encrypted (ops responsibility)

### Secrets
- Never committed; managed via `.env.production.example` template
- `AUTH_SECRET`, `REDMINE_ENC_KEY` generated with `openssl rand`

---

## Future Enhancements

- [ ] Configurable min session length (currently 1 min)
- [ ] Broader audit trail coverage (read operations, data exports)
- [ ] Offline mode for time entry + sync when back online
- [ ] Mobile app (React Native / Flutter)
- [ ] Batch Redmine issue import
- [ ] Salary advance / withholding adjustment UI
- [ ] Export to accounting software (Xero, Wave)
