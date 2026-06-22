# Codebase Summary — 9stimesheet

Quick reference for developers onboarding or searching for code (2026).

---

## Directory Structure

```
9stimesheet/
├── app/                           # Next.js App Router (3 top-level routes)
│   ├── layout.tsx                 # Root layout
│   ├── (app)/                     # Protected route group (behind auth)
│   │   ├── layout.tsx             # App layout + nav
│   │   ├── page.tsx               # Manager dashboard / freelancer read-only
│   │   ├── admin/                 # ADMIN-only routes
│   │   │   ├── users/
│   │   │   ├── audit/
│   │   │   └── layout.tsx
│   │   ├── manager/               # MANAGER|ADMIN-only routes
│   │   │   ├── clients/
│   │   │   ├── projects/
│   │   │   ├── approvals/
│   │   │   ├── income/
│   │   │   ├── disbursements/
│   │   │   ├── expenses/
│   │   │   ├── irregular-expenses/
│   │   │   ├── fixed-costs/
│   │   │   ├── reports/           # Finance, payout, billing, profitability
│   │   │   └── layout.tsx
│   │   ├── timesheet/             # All users; /admin can ?userId=X
│   │   │   ├── page.tsx
│   │   │   ├── actions.ts         # Server actions
│   │   │   ├── *-columns.tsx      # DataTable column definitions
│   │   │   ├── *-table.tsx        # Table components
│   │   │   └── work-session-*.tsx # Timer component
│   │   └── settings/
│   │       └── redmine/           # Redmine API key management
│   ├── login/
│   │   ├── page.tsx
│   │   └── login-form.tsx
│   └── set-password/              # Invite token flow
│       └── [token]/
├── components/
│   ├── ui/                        # Reusable UI components (shadcn/radix)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── submit-button.tsx      # Prevents multi-submit via useFormStatus
│   │   ├── data-table.tsx         # Wrapper for TanStack Table
│   │   └── ... (20+ shadcn components)
│   ├── data-table/
│   │   ├── data-table.tsx         # Generic table with sort/filter/paginate
│   │   └── column-header.tsx      # Sortable header
│   ├── reports/
│   │   └── period-nav.tsx         # Period selector (week/month/year/etc)
│   └── ... (other domain components)
├── lib/
│   ├── db.ts                      # Prisma singleton, adapter selection
│   ├── auth.ts                    # Auth.js v5 config
│   ├── auth.config.ts             # Auth.js edge-safe config (authorized callback)
│   ├── auth.ts                    # Auth.js node setup (Credentials provider, bcrypt)
│   ├── proxy.ts                   # Next.js 16 middleware (renamed): session / route guard
│   │
│   ├── period.ts                  # Calendar period math (week/month/quarter/half/year/all)
│   ├── period.test.ts             # Period tests
│   ├── clock.ts                   # Asia/Saigon timezone helpers (nowSaigon, now)
│   ├── money.ts                   # VND formatting & parsing (integer dong)
│   ├── money.test.ts              # Money tests
│   │
│   ├── payroll.ts                 # Gross, tax, net computation
│   ├── payroll.test.ts            # Payroll tests
│   ├── rates.ts                   # Rate resolution (assignment override → user default)
│   ├── rates-resolve.ts           # Query helpers for rate resolution
│   ├── rates.test.ts              # Rate tests
│   ├── work-session.ts            # Timer duration, rounding logic
│   ├── work-session.test.ts       # Work session tests
│   │
│   ├── reporting.ts               # High-level report types
│   ├── reporting-db.ts            # DB queries for reports (payoutByUser, billingByClient)
│   ├── reporting.test.ts          # Reporting tests
│   ├── finance-overview.ts        # Cash model computation (income − disbursed − expenses)
│   ├── profitability.ts           # Fixed-cost allocation (largest-remainder method)
│   ├── profitability.test.ts      # Profitability tests
│   ├── dashboard.ts               # Manager KPI computation
│   │
│   ├── validation.ts              # Zod schemas (create/update/delete)
│   ├── validation.test.ts         # Schema tests
│   ├── audit.ts                   # Audit log recording
│   ├── rbac.ts                    # Role guards (requireUser, requireManager, requireRole)
│   ├── roles.ts                   # Role types (no Prisma import; edge-safe)
│   ├── crypto.ts                  # AES-256-GCM encrypt/decrypt (Redmine keys)
│   ├── csv.ts                     # CSV export helpers
│   ├── csv.test.ts                # CSV tests
│   │
│   ├── schema-parity.test.ts      # Ensures dev & prod schemas match
│   └── types.ts                   # Shared TypeScript types
├── prisma/
│   ├── schema.prisma              # Dev schema (SQLite)
│   ├── schema.prod.prisma         # Prod schema (PostgreSQL) — keep in sync with schema.prisma
│   ├── seed.ts                    # Dev data seed
│   ├── migrations/                # Auto-generated Prisma migrations (10 total)
│   └── docker-entrypoint.sh       # On-startup DB provisioning
├── public/
│   └── ... (static assets)
├── scripts/
│   ├── bootstrap-admin.ts         # Create initial admin user
│   └── ... (utility scripts)
├── e2e/
│   ├── auth.spec.ts               # Stub for auth tests
│   ├── ... (other test stubs)
│   └── playwright.config.ts       # Playwright config
├── tests/
│   └── ... (integration test stubs)
├── docs/
│   ├── system-architecture.md     # This file
│   ├── code-standards.md
│   ├── project-overview-pdr.md
│   ├── codebase-summary.md        # This file
│   ├── design-guidelines.md
│   ├── project-roadmap.md
│   └── deployment-guide.md
├── Dockerfile                     # Multi-stage build
├── docker-compose.yml             # Dev + prod configs
├── package.json
├── pnpm-lock.yaml                 # Dependency lock (git-ignored globally)
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── eslintrc.json
├── .env.example
├── .env.production.example        # Secrets template
├── README.md
└── CLAUDE.md                      # Project-specific Claude instructions

Total: ~90 files (app + components + lib + prisma + e2e + tests + config)
```

---

## Code Statistics

| Category | Files | LOC | Notes |
|----------|-------|-----|-------|
| **App** | 45 | ~6,700 | Routes, pages, server actions |
| **Components** | 27 | ~3,200 | UI + data-table + reports |
| **Lib** | 46 | ~2,600 | Business logic, pure functions |
| **Prisma** | 1 schema + 10 migrations | ~350 | SQLite (dev) + PostgreSQL (prod) |
| **Tests** | 10 test files | ~500 | Vitest (unit), Playwright (e2e) |
| **Scripts** | 3 | ~150 | Bootstrap, seed, utilities |
| **Config & Docs** | 15 | ~3,000 | Package, build, CI/CD, markdown |
| **TOTAL** | ~150 | ~16,000+ | Across all categories |

---

## Key Modules

### Authentication & RBAC (`lib/auth.ts`, `lib/rbac.ts`, `lib/roles.ts`)
- Auth.js v5 (Credentials provider + bcrypt)
- Middleware checks session on protected routes
- Role guards: `requireUser()`, `requireManager()`, `requireRole()`
- Roles: ADMIN, MANAGER, EMPLOYEE, FREELANCER (enum-like, stored as strings in DB)

### Database (`lib/db.ts`, `prisma/`)
- **Models** (13 total): User, TimeEntry, Project, Task, Assignment, Expense, Income, Disbursement, WorkSession, FixedCost, AuditLog, InviteToken, FixedCost
- **Adapter Selection:** Runtime check of `DATABASE_URL` scheme (file: → SQLite, postgres: → PostgreSQL)
- **Schema Parity:** `prisma/schema.prisma` (dev) and `prisma/schema.prod.prisma` (prod) kept in sync; enforced by test
- **Migrations:** 10 auto-generated Prisma migrations

### Time & Period (`lib/period.ts`, `lib/clock.ts`)
- **Period Math:** Week, month, quarter, half, year, all-time with [start, end) boundaries
- **Timezone:** UTC-midnight storage; display via Asia/Saigon (UTC+7)
- **Helpers:** `nowSaigon()`, `monthPeriodOf()`, `shiftPeriod()`, `formatISODate()`

### Payroll & Rates (`lib/payroll.ts`, `lib/rates.ts`, `lib/work-session.ts`)
- **Gross Pay:** hours × costRateSnapshot
- **Tax:** PIT withholding in basis points (10% = 1000 bps), frozen at approval
- **Employer Cost:** Insurance in basis points, frozen at approval
- **Rate Resolution:** Assignment override → User default (fallback chain)
- **Work Session:** Duration ≥1 min (15-min blocks), max 4h per session

### Reporting (`lib/reporting.ts`, `lib/reporting-db.ts`, `lib/finance-overview.ts`, `lib/profitability.ts`)
- **Cash Model:** income − disbursed − expenses = actualNet
- **Projected Net:** actualNet − unpaidPayroll − employerInsurance
- **Payout:** Gross/tax/net per user
- **Billing:** Revenue by client
- **Profitability:** Fixed-cost allocation via largest-remainder method

### Validation (`lib/validation.ts`)
- Zod schemas for all mutations (create/update/delete timesheet, project, user, etc.)
- Schema names: `zCreateTimeEntrySchema`, `zUpdateProjectSchema`, etc.

### Audit (`lib/audit.ts`)
- Denormalized audit trail: actor (id + name + role), action, summary (Vietnamese), target (type + id)
- Best-effort; errors don't roll back mutations

### Money (`lib/money.ts`)
- **Invariant:** All money = integer VND (no fractional units)
- **Functions:** `formatVnd()`, `parseVnd()`, `toVndInt()` (assertion)

### Crypto (`lib/crypto.ts`)
- AES-256-GCM encryption/decryption for Redmine API keys at rest

### CSV Export
- Route handlers in each report page: `/api/reports/finance/export`, `/api/billing/export`, etc.
- Returns CSV with headers, rows, proper escaping

---

## Key Features by Route

| Route | Component | Purpose | RBAC |
|-------|-----------|---------|------|
| `/` | Dashboard | KPIs, team hours | All |
| `/timesheet` | TimeSheet page + actions | Manual entry, timer, submit | All; `?userId=X` Admin only |
| `/manager/clients` | Clients page | Tree: clients → projects | MANAGER+ |
| `/manager/projects/[id]` | Project detail | Tasks, assignments, rate overrides | MANAGER+ |
| `/manager/approvals` | Approvals page | Batch approve/reject | MANAGER+ |
| `/manager/income` | Income page | Log revenue sources | MANAGER+ |
| `/manager/disbursements` | Disbursements page | Log actual payouts | MANAGER+ |
| `/manager/expenses` | Expenses page | Log regular/irregular spend | MANAGER+ |
| `/manager/fixed-costs` | Fixed costs page | Monthly operating expenses | MANAGER+ |
| `/manager/reports/finance` | Finance report | Cash flow KPIs, CSV export | MANAGER+ |
| `/payout` | Payout report | Gross/tax/net, CSV export | MANAGER+ |
| `/payout/[userId]` | User payout detail | Per-user breakdown | MANAGER+ |
| `/billing` | Billing report | Revenue by client, CSV export | MANAGER+ |
| `/profitability` | Profitability report | Project margins, CSV export | MANAGER+ |
| `/admin/users` | User management | CRUD, roles, rates, tax | ADMIN |
| `/admin/audit` | Audit log | Query mutations, searchable | ADMIN |
| `/settings/redmine` | Redmine connect | API key, link to Redmine | All |
| `/login` | Login form | Credentials auth | Public |
| `/set-password/[token]` | Invite flow | First-time password set | Public (token-gated) |

---

## Testing Overview

### Unit Tests (10 files, ~500 LOC)
- `lib/period.test.ts` — Period boundaries, shifting
- `lib/money.test.ts` — VND formatting, parsing, integer assertion
- `lib/payroll.test.ts` — Gross/tax/net computation
- `lib/rates.test.ts` — Rate resolution (assignment override)
- `lib/work-session.test.ts` — Duration rounding, max 4h
- `lib/reporting.test.ts` — Report aggregation logic
- `lib/profitability.test.ts` — Fixed-cost allocation
- `lib/csv.test.ts` — CSV generation and escaping
- `lib/validation.test.ts` — Schema validation
- `lib/schema-parity.test.ts` — Dev/prod schema sync enforcement

### E2E Tests (Playwright)
- Configured in `playwright.config.ts`
- Stubs in `e2e/*.spec.ts` (auth, timesheet, approval flows — not yet comprehensive)
- Run: `pnpm e2e`

---

## Deployment Artifacts

### Docker Build
- `Dockerfile` (multi-stage: builder + runtime)
- `docker-compose.yml` (services: caddy, app, db)
- `.dockerignore` (excludes node_modules, .git, etc.)

### Environment
- `.env.production.example` (secrets template)
- `scripts/bootstrap-admin.ts` (initial admin creation)
- `prisma/docker-entrypoint.sh` (DB provisioning on start)

### CI/CD
- None configured (no `.github`/CI). Gates run locally: `tsc`, `eslint`, `vitest`.
- Deploy is manual: `git archive` over SSH + `docker compose up -d --build` (see deployment-guide).

---

## Dependencies (Key)

| Dependency | Version | Purpose |
|------------|---------|---------|
| next | 16.2.9 | App Router, RSC, Server Actions |
| react | 19.2.4 | UI framework |
| typescript | 5 | Type safety |
| prisma | 7.8 | ORM with driver adapters |
| @prisma/adapter-better-sqlite3 | 7.8 | SQLite adapter (dev) |
| @prisma/adapter-pg | 7.8 | PostgreSQL adapter (prod) |
| next-auth | 5.0.0-beta.31 | Authentication |
| bcryptjs | 3.0.3 | Password hashing |
| zod | 4.4.3 | Schema validation |
| tailwindcss | 4 | CSS framework |
| shadcn/ui | 4.11.0 | Component library (radix-ui + tailwind) |
| @tanstack/react-table | 8.21.3 | DataTable sorting/filtering |
| recharts | 3.8.0 | Charts (bar, line, pie) |
| sonner | 2.0.7 | Toast notifications |
| next-themes | 0.4.6 | Dark mode |
| lucide-react | 1.21.0 | Icons |
| better-sqlite3 | 12.11.1 | SQLite driver |
| pg | 8.22.0 | PostgreSQL driver |
| dotenv | 17.4.2 | .env file loading |
| vitest | 4.1.9 | Unit test runner |
| @playwright/test | 1.61.0 | E2E testing |
| eslint | 9 | Linting |

---

## Development Workflow

### Setup
```bash
pnpm install              # Install dependencies
pnpm db:generate         # Generate Prisma client
pnpm db:migrate          # Create dev DB (SQLite)
pnpm dev                 # Start dev server (http://localhost:3000)
```

### Regular Commands
```bash
pnpm test                # Unit tests
pnpm test:watch         # Watch mode
pnpm lint               # ESLint check (with --fix to auto-repair)
pnpm build              # Production build
pnpm start              # Run prod build
pnpm e2e                # E2E tests
pnpm db:studio          # Prisma Studio GUI
```

### Before Commit
- [ ] `pnpm test` passes
- [ ] `pnpm lint` passes (run `pnpm lint --fix` if needed)
- [ ] `pnpm build` succeeds
- [ ] Schemas in sync (test catches divergence)
- [ ] Audit log recorded for mutations
- [ ] Conventional commit message

---

## Notable Code Patterns

### Server Action with Validation
```typescript
"use server";
import { zTimeEntrySchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";
import { requireUser } from "@/lib/rbac";

export async function submitTimeEntry(entryId: string) {
  const session = await auth();
  requireUser(session?.user);
  
  const entry = await prisma.timeEntry.update({
    where: { id: entryId },
    data: { status: "SUBMITTED" }
  });
  
  await recordAudit("timeentry.submit", "Submitted", "TimeEntry", entryId);
  return { success: true, entry };
}
```

### Period-Filtered Query
```typescript
const period = monthPeriodOf(new Date());
const entries = await prisma.timeEntry.findMany({
  where: {
    userId,
    status: "APPROVED",
    date: { gte: period.start, lt: period.end }
  }
});
```

### Rate Resolution
```typescript
const costRate = 
  assignment?.costRateOverride ?? 
  user.defaultCostRate;
```

### Money Computation
```typescript
const gross = hours * costRate;
const tax = Math.trunc((gross * taxRateBps) / 10000);
const net = toVndInt(gross - tax);
```

---

## Quick Reference for Common Tasks

| Task | File(s) | Command |
|------|---------|---------|
| Add a new route | Create `app/(app)/feature/page.tsx` + `actions.ts` | `pnpm dev` |
| Add a new Zod schema | `lib/validation.ts` | Import in server action |
| Change data model | `prisma/schema.prisma` + `prisma/schema.prod.prisma` | `pnpm db:migrate` |
| Add unit test | `lib/module.test.ts` | `pnpm test` |
| Add server action | `app/route/actions.ts` | Use in form via `action={}` |
| Add component | `components/domain/name.tsx` | Import & use in pages |
| Export CSV | Create route handler in `app/api/export/route.ts` | Return CSV response |
| Redmine integration | `lib/redmine-*.ts` | Encrypted keys via crypto.ts |
| Audit mutation | Call `recordAudit()` after update | Use in server actions |

---

## Useful Grep Patterns

```bash
# Find all server actions
grep -r '"use server"' app/

# Find all Zod schemas
grep -r 'z[A-Z].*Schema' lib/validation.ts

# Find all RBAC checks
grep -r 'require(User|Manager|Role)' app/ lib/

# Find all audit logging
grep -r 'recordAudit' app/

# Find rate computation
grep -r 'costRate\|billableRate' lib/

# Find period-filtered queries
grep -r 'period\.(start|end)' lib/ app/

# Find money operations
grep -r 'formatVnd\|toVndInt' app/ lib/
```

---

## Future Improvements

- [ ] Comprehensive E2E test suite (currently stubs)
- [ ] Async Redmine sync queue (reduce manual retry)
- [ ] Offline mode (PWA + local sync)
- [ ] Real-time notifications (WebSocket for admins)
- [ ] Bulk time entry import (CSV upload)
- [ ] Export to accounting software (Xero, Wave)
- [ ] Performance monitoring (Vercel Analytics or similar)
- [ ] Database query logging & analysis (slow query detection)

---

## Contact & Troubleshooting

- **Local DB reset:** `rm dev.db && pnpm db:migrate && pnpm db:seed`
- **Prisma cache:** `rm -rf generated/prisma && pnpm db:generate`
- **Schema sync failure:** Run `lib/schema-parity.test.ts` to identify divergence
- **Auth issues:** Check `AUTH_SECRET` in `.env.local`
- **Redmine connection:** Verify `REDMINE_URL` and user API key encryption

For detailed guidance, see `README.md`, `docs/system-architecture.md`, and `docs/code-standards.md`.
