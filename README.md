# 9stimesheet

Internal timesheet, cost tracking, and financial reporting tool for 9stack — a Vietnamese software team. Enables time entry (manual + live timer), approval workflows, payroll calculations with tax deductions, project-based cost and revenue tracking, and month-to-month financial overview.

**Status:** Production (https://timesheet.9stack.vn)  
**Users:** ~20 team members (Employees & Freelancers) + Managers + 1 Admin

---

## Stack

- **Framework:** Next.js 16.2.9 (App Router, React Server Components, Server Actions)
- **Database:** SQLite (dev) / PostgreSQL (prod) via Prisma 7.8 with driver adapters (`@prisma/adapter-better-sqlite3`, `@prisma/adapter-pg`)
- **Auth:** Auth.js v5 (Credentials provider + bcrypt)
- **UI:** React 19, Tailwind v4, shadcn/ui, Radix UI, Lucide icons
- **Tables & Charts:** TanStack Table, Recharts
- **Validation:** Zod v4
- **Testing:** Vitest (unit), Playwright (E2E)

---

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm (or npm/yarn)
- SQLite (bundled) for dev

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Generate Prisma client
pnpm db:generate

# 3. Set up the database (creates SQLite file, seeds optional data)
pnpm db:migrate

# 4. Start the dev server
pnpm dev
```

Open http://localhost:3000. Login with credentials from `.env.local` (or see dev seed in `prisma/seed.ts`).

### Commands

```bash
pnpm dev              # Start dev server (http://localhost:3000)
pnpm build            # Build for production
pnpm start            # Run production build
pnpm test             # Run unit tests (Vitest)
pnpm test:watch       # Watch mode for unit tests
pnpm e2e              # Run E2E tests (Playwright)
pnpm lint             # ESLint check
pnpm db:migrate       # Create/apply Prisma migrations
pnpm db:generate      # Regenerate Prisma client
pnpm db:seed          # Seed dev data
pnpm db:studio        # Open Prisma Studio (GUI)
```

---

## Architecture Overview

**Layers:**
1. **RSC Pages** (`app/(app)/**/page.tsx`) — Server-side data fetching, role-based auth
2. **Server Actions** (`actions.ts` in each route) — Form submissions, mutations with Zod validation
3. **Business Logic** (`lib/*.ts`) — Payroll, reporting, period calculations, RBAC, audit
4. **Prisma ORM** — `lib/db.ts` selects SQLite (dev) or PostgreSQL (prod) at runtime
5. **Database** — 13 models covering Users, TimeEntries, Projects, Financials, Audit

**Dual-Schema:** `prisma/schema.prisma` (dev/SQLite) and `prisma/schema.prod.prisma` (prod/PostgreSQL) are kept in sync; schema parity is enforced by `lib/schema-parity.test.ts`.

---

## Key Features

### Timesheet (`/timesheet`)
- **Manual Entries:** Add hours, notes, assigned task; status workflow DRAFT → SUBMITTED → APPROVED/REJECTED
- **Live Timer:** Start/stop work session (≥1 min, max 4h per session) → auto-creates DRAFT entry
- **Redmine Sync:** Pull assigned issues from Redmine, push approved hours back (best-effort, idempotent)
- **Admin On-Behalf:** Admins can log time for other users (e.g., retroactive adjustments)
- **Personal Income:** Lifetime gross, tax withheld, net pay, plus period breakdown

### Manager Dashboard (`/manager/*`)
- **Clients & Projects:** Tree-view with project assignments
- **Approvals:** Review and approve/reject time entries
- **Disbursements:** Record actual payouts ("đối soát") separate from derived payout
- **Expenses:** Track regular and irregular (unexpected) spending by project
- **Income:** Log revenue sources (client billing, capital injections, etc.)
- **Fixed Costs:** Monthly operating expenses with active badge and period totals

### Reporting
- **Finance Overview** (`/manager/reports/finance`): Cash model — actualNet = Income − Disbursed − Operating Expenses; projectedNet also subtracts unpaid payroll & employer insurance. CSV export.
- **Payout** (`/payout`, `/payout/[userId]`): Per-user or team-wide gross/tax/net breakdown. CSV export.
- **Billing** (`/billing`): Revenue by client. CSV export.
- **Profitability** (`/profitability`): Project margins using largest-remainder fixed-cost allocation by hours. CSV export.

### Admin (`/admin/*`)
- **User Management:** Create, enable/disable, set roles, configure tax/insurance rates
- **Audit Log:** Searchable activity trail (who, what, when, target)
- **Settings:** Redmine API key and shared instance configuration

---

## Key Concepts

### Money & Tax
- **All money is integer VND** (đồng; no fractional units)
- **Tax rates stored in basis points** (bps; 10% = 1000 bps)
- **PIT Withholding:** Deducted from collaborator gross pay (e.g., `taxWithholdingRateBps = 1000` = 10%)
- **Employer Insurance:** Added on top as company cost (e.g., `employerCostRateBps = 2150` = 21.5%)
- **Rate Snapshots:** At approval time, cost/billable/tax rates are frozen in TimeEntry; reports always use snapshots for historical accuracy

### Periods
- Support week, month, quarter, half-year, year, or all-time
- Calendar-based; boundaries are [start, end) — start inclusive, end exclusive
- Stored and computed as UTC-midnight dates (matching Prisma `@db.Date` round-trip)

### Roles & RBAC
- `ADMIN` — Full system access; can act on behalf of users; edit all data
- `MANAGER` — Approve time, manage projects, view reports
- `EMPLOYEE` — Log and submit time, view own income
- `FREELANCER` — Same as EMPLOYEE; used for contract workers (no insurance)
- See `lib/rbac.ts` for `requireUser()`, `requireManager()`, `requireRole([...])` server-side guards

### Work Session
- **Live timer** per user (max 1 open session at a time, enforced by `@@unique([userId])`)
- Duration ≥1 min (rounded down to 15-min blocks), max 4h per session
- On End: Creates a DRAFT TimeEntry with hours computed server-side; user can edit before submit

### Redmine Integration
- Optional; gated by `REDMINE_URL` env var (if absent, feature is dormant)
- Per-user encrypted API key (AES-256-GCM, `lib/crypto.ts`)
- Users connect own key at `/settings/redmine`
- Managers map app Project to Redmine project ID
- Sync pulls issues as Tasks; approved time is pushed back (idempotent, best-effort retry)

---

## Documentation

- **[System Architecture](./docs/system-architecture.md)** — Detailed component interaction, data models, dual-adapter strategy
- **[Code Standards](./docs/code-standards.md)** — Naming, conventions, mutation patterns, validation, testing
- **[Project Overview & PDR](./docs/project-overview-pdr.md)** — Feature summary, requirements, acceptance criteria
- **[Deployment Guide](./docs/deployment-guide.md)** — Docker Compose on Ubuntu, secrets, deploy & redeploy steps, operations
- **[Codebase Summary](./docs/codebase-summary.md)** — High-level module breakdown and statistics
- **[Design Guidelines](./docs/design-guidelines.md)** — UI conventions, component library usage, dark mode
- **[Project Roadmap](./docs/project-roadmap.md)** — Shipped features, forward priorities

---

## Development

All new commits use [Conventional Commits](https://www.conventionalcommits.org/).  
Pull requests into `main` require passing tests and linting.

### Testing

```bash
# Unit tests (live DB tests avoided; focus on lib functions)
pnpm test

# E2E tests (Playwright; runs against live server)
pnpm e2e

# Watch mode (unit)
pnpm test:watch
```

### Git Workflow

Remote: `9stack-ai/opentimesheet` (GitHub). Deploys ship the working tree via
`git archive` over SSH (see `docs/deployment-guide.md`) — independent of the remote.

```bash
git checkout -b feat/my-feature
# ... make changes ...
pnpm exec tsc --noEmit && pnpm exec eslint . && pnpm exec vitest run   # gates
git commit -am "feat(timesheet): add bulk-edit capability"            # conventional commits
git push -u origin feat/my-feature                                    # then PR, or FF-merge to main locally
```

---

## Troubleshooting

**"DATABASE_URL is not set"** → Set `DATABASE_URL` in `.env.local` (e.g., `file:./dev.db` for SQLite).

**Prisma migration errors** → Ensure `schema.prisma` and `schema.prod.prisma` remain in sync. Run `pnpm db:migrate` or `pnpm db:generate`.

**Auth fails** → Verify `AUTH_SECRET` in `.env.local` is set and consistent. Check `auth.config.ts` / `auth.ts`.

**Redmine sync stalls** → Check `REDMINE_URL`, `REDMINE_ENC_KEY` env vars; review `redminePushStatus` in audit logs. Manual retry via manager UI.

---

## License & Contact

Internal 9stack tool. For support or contributions, contact the team lead.
