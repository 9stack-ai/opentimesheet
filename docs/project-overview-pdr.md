# Project Overview & PDR — 9stimesheet

---

## What It Is

**9stimesheet** is an internal timesheet, cost tracking, and financial reporting tool for 9stack, a Vietnamese software team of ~20 people. It replaces manual spreadsheets and enables:

- **Time Entry**: Manual entry or live timer; workflow status (DRAFT → SUBMITTED → APPROVED/REJECTED)
- **Approval**: Managers review and approve time, with automatic snapshots of rates for historical accuracy
- **Payroll**: Automatic gross, tax withholding (PIT), and employer insurance calculation at approval
- **Project Costing**: Track actual vs. billable rates; assign work to clients and projects
- **Financial Reporting**: Monthly cash flow overview (income, disbursements, operating expenses, net), payout breakdowns, client billing, and project profitability
- **Redmine Integration**: Sync assigned issues; push approved hours back (optional, per-instance)
- **Audit Trail**: Complete record of mutations with actor, action, target, and timestamp

**Status**: In active development through 2026; deployed for internal use at https://timesheet.9stack.vn.

---

## Key Actors

| Role | Responsibilities | Primary Screens |
|------|------------------|-----------------|
| **Freelancer/Employee** | Log time (manual + timer), submit, view personal income | `/timesheet`, `/` (dashboard read-only) |
| **Manager** | Approve/reject time, manage projects & clients, log expenses/income, view reports, reconcile disbursements | `/manager/approvals`, `/manager/clients`, `/manager/projects/*`, `/manager/expenses`, `/manager/reports/*` |
| **Admin** | User mgmt, set rates & tax, enable Redmine, audit log, act on behalf of users | `/admin/users`, `/admin/audit`, `/settings/redmine` |
| **System** | Redmine sync (async, best-effort), audit logging, rate snapshots at approval | Background jobs, middleware |

---

## Shipped Features

### Time Entry & Approval
- ✅ Manual time entry (date, hours, task, note)
- ✅ Live work session timer (start/stop, min 1 min, max 4h per session)
- ✅ Status workflow: DRAFT → SUBMITTED → APPROVED or REJECTED
- ✅ Batch approval UI (manager)
- ✅ Admin on-behalf logging (for retroactive entries, e.g., sick leave makeup)
- ✅ Rate snapshots frozen at approval (cost, billable, tax, employer cost in basis points)
- ✅ Task assignment per entry (linked to Project → Client)

### Redmine Integration
- ✅ Per-user encrypted API key management (`/settings/redmine`)
- ✅ Sync Redmine issues → Tasks (pull)
- ✅ Push approved time entries → Redmine (push, idempotent, best-effort retry)
- ✅ Manager maps app Project to Redmine project ID
- ✅ Status tracking per entry (pending, pushing, pushed, failed, skipped)
- ✅ Error messages stored for debugging
- ✅ Feature dormant if `REDMINE_URL` not set (no impact elsewhere)

### Project & Client Management
- ✅ Client tree (clients → projects → tasks)
- ✅ Per-project rate overrides (cost & billable) for each user via Assignments
- ✅ Archive/activate projects
- ✅ CRUD operations with audit logging

### Financial Reporting
- ✅ **Finance Overview** (`/manager/reports/finance`): Cash model with KPI cards
  - Income (from `Income` table)
  - Disbursed (from `Disbursement` table, grouped by salary period)
  - Operating expenses (from `Expense` table + fixed-cost accrual)
  - Actual net = income − disbursed − expenses
  - Projected net = actual net − unpaid payroll − employer insurance
  - CSV export
- ✅ **Payout** (`/payout`): Gross, tax withheld, net per user (team-wide or individual)
  - Gross = sum(approvedHours × costRateSnapshot)
  - Tax = gross × taxRateSnapshot / 10000
  - Employer cost = gross × employerCostRateBps / 10000
  - CSV export
- ✅ **Billing** (`/billing`): Revenue by client (sum of billableRateSnapshot × approvedHours)
  - CSV export
- ✅ **Profitability** (`/profitability`): Project margins
  - Allocates fixed costs to projects by hours worked (largest-remainder method)
  - CSV export

### Payroll & Tax
- ✅ PIT withholding (basis points, frozen at approval)
- ✅ Employer insurance cost (basis points, frozen at approval)
- ✅ User-level default rates; per-project overrides via Assignment
- ✅ Audit trail of all rate changes

### Expense & Income Tracking
- ✅ Expenses: REGULAR or IRREGULAR (chi bất thường), optional project assignment
- ✅ Income: Free-text source (e.g., client billing, capital, interest), optional project assignment
- ✅ Fixed costs: Monthly recurring (e.g., office rent, insurance) with effective date range
- ✅ Period-filtered views (manager)

### Disbursements (Actual Payout)
- ✅ Record actual cash paid to users (thực chi)
- ✅ Tied to salary period ("YYYY-MM" format for reconciliation)
- ✅ Separate from TimeEntry-derived payout (accounting accuracy)
- ✅ Reconciliation view: compare disbursed vs. earned payout

### Admin & User Management
- ✅ User CRUD (create, enable/disable, set role)
- ✅ Batch invite via tokens (expiring, one-time use)
- ✅ Password set flow for invited users
- ✅ Per-user tax & insurance rate configuration
- ✅ Role: ADMIN, MANAGER, EMPLOYEE, FREELANCER

### Audit & Compliance
- ✅ Audit log: every mutation recorded (action, actor, target, timestamp, summary in Vietnamese)
- ✅ Queryable by action, actor, date range, target
- ✅ Admin UI at `/admin/audit`
- ✅ Denormalized actor name (survives user deletion)

### Dashboard & UX
- ✅ Manager dashboard (`/`) with KPI cards (income, expenses, net, team hours)
- ✅ Freelancer chart showing hours by project (lifetime or period-filtered)
- ✅ Period navigation (week/month/quarter/half/year/all-time)
- ✅ Dark mode (via next-themes)
- ✅ Vietnamese UI (locale-aware formatting)
- ✅ Toast notifications (Sonner) for user feedback
- ✅ Responsive design (mobile-first, Tailwind v4)

### Authentication & Security
- ✅ Credentials-based auth (email + password, bcrypt hashing)
- ✅ Secure session cookies (httpOnly, SameSite, Secure in prod)
- ✅ RBAC middleware (protects `/admin`, `/manager` routes)
- ✅ Redmine API keys encrypted at rest (AES-256-GCM)
- ✅ No direct DB access in tests (safety)

### Testing & Quality
- ✅ Unit tests (Vitest): payroll, reporting, periods, rates, profitability, money formatting, schema parity (10 test files)
- ✅ E2E tests (Playwright) configured, basic setup ready
- ✅ ESLint + TypeScript strict mode
- ✅ Schema parity test ensures dev/prod schemas stay in sync

### Deployment
- ✅ Docker Compose (single host: Caddy, Next.js app, PostgreSQL)
- ✅ Automatic TLS via Let's Encrypt (Caddy)
- ✅ Git-based deploy (tar archive → SSH → docker compose up)
- ✅ Secrets via `.env.production` (never committed)
- ✅ Bootstrap admin on first start
- ✅ Database provisioning via `prisma db push`

---

## Product Requirements Document (PRD)

### Functional Requirements

#### FR-1: Time Entry Management
- Users can manually enter time (date, hours, task, note)
- Users can start/stop live work session (auto-creates DRAFT entry on stop)
- Session constraints: ≥1 min duration (rounded to 15 min blocks), max 4h per session
- Submitted entries show status; users cannot edit once submitted
- Managers can approve, reject (with reason), or request changes
- Admin can log time on behalf of users
- TimeEntry model: status (DRAFT|SUBMITTED|APPROVED|REJECTED), rate snapshots at approval

**Acceptance Criteria:**
- User creates entry → stored as DRAFT
- User submits → status → SUBMITTED, cannot edit
- Manager approves → status → APPROVED, snapshots frozen
- Manager rejects → status → REJECTED, reason shown
- Snapshots (costRate, billableRate, tax rates) match user defaults or assignment overrides at approval time
- Audit log records all state changes

#### FR-2: Rate Management & Overrides
- Each user has default cost rate (what we pay) and billable rate (what client pays)
- Each project can override rates for a specific user (Assignment model)
- On entry creation, display effective rate (override or default)
- At approval, snapshot and freeze the rate (immutable for reporting)
- Tax rates (PIT withholding, employer insurance) also snapshots at approval

**Acceptance Criteria:**
- User default rates changeable by admin
- Project-level overrides override user defaults
- Rate resolution order: Assignment override → User default
- Snapshot locks rate for historical accuracy
- Reports always use snapshots, never live rates

#### FR-3: Payroll Calculation
- Gross pay = sum(approvedHours × costRateSnapshot) for a user in a period
- PIT withholding = gross × taxWithholdingRateBps / 10000 (basis points)
- Employer cost = gross × employerCostRateBps / 10000 (company pays on top)
- Net pay = gross − withholding
- All money computed as integer VND (no fractional dong)
- Tax & employer cost rates frozen at approval

**Acceptance Criteria:**
- Gross pay computed correctly
- Tax withheld matches configured rate
- Employer cost calculated separately
- All values integer VND (no rounding drift)
- Payout report matches sum of individual entries
- Historical payouts stable (snapshots prevent rate changes from affecting past)

#### FR-4: Project & Client Management
- Organize work by client → project → task
- Each user can be assigned to a project with optional rate override
- Projects can be archived (soft delete)
- Manager CRUD for clients and projects
- All changes audit-logged

**Acceptance Criteria:**
- Create/read/update/delete clients
- Create/read/update/delete projects under clients
- Assign users to projects
- Rate override persists with assignment
- Archived projects hidden by default (but queryable)

#### FR-5: Financial Reporting
- Manager can view period-filtered (week/month/quarter/year/all-time) cash flow overview
- Cash model: actualNet = Income − Disbursed − OperatingExpenses
- Projected net subtracts unpaid payroll and employer insurance
- Reports exportable as CSV
- Payout, billing, profitability reports available

**Acceptance Criteria:**
- Finance overview shows all KPIs (income, expenses, net)
- Period selector works (shifts boundaries correctly)
- CSV exports with full data
- Payout report matches gross/tax/net per user
- Billing report sums by client
- Profitability allocates fixed costs correctly
- Export includes headers, formatting, and timestamp

#### FR-6: Redmine Integration (Optional)
- Per-user encrypted API key storage
- Manager maps app Project to Redmine project ID
- Users sync Redmine issues → Tasks (pull)
- Approved time pushes back to Redmine (push, idempotent)
- Status tracking: pending, pushing, pushed, failed, skipped
- Feature dormant if REDMINE_URL env var not set

**Acceptance Criteria:**
- User can securely store & update Redmine API key
- Manager can link app Project to Redmine project
- Sync button pulls issues and creates Tasks
- Approved time pushes to Redmine automatically (or via retry button)
- Push status visible in table
- Error messages shown on failure
- Retries are safe (idempotent)
- No Redmine errors break timesheet operation

#### FR-7: Admin & User Management
- Admin can create, enable/disable, set roles (ADMIN|MANAGER|EMPLOYEE|FREELANCER)
- Admin can configure per-user tax & insurance rates
- Admin can view audit log (filtered by action, actor, date)
- Invited users get email with secure link to set password
- Password reset flow available
- Users cannot modify their own role or rate

**Acceptance Criteria:**
- Create user with email, name, role
- Update user role/rates
- Disable user (prevents login)
- Invite token expires after 24h
- User sets password via link (one-time use)
- Audit log searchable & complete

#### FR-8: Audit & Compliance
- Every mutation recorded: action, actor, target, timestamp, summary (Vietnamese)
- Admin can query audit log by date range, action, actor
- Denormalized actor name (record survives deletion)
- Best-effort (errors don't roll back mutations)

**Acceptance Criteria:**
- Audit log queried in admin UI
- Actions include: create, update, delete, approve, reject, push_redmine, etc.
- Summary is human-readable Vietnamese
- Date range filtering works
- CSV export of audit log available (optional)

---

### Non-Functional Requirements

#### NF-1: Performance
- Dashboard loads in <2s
- Report generation <3s for 1-year data
- CSV export <5s
- Database indexes on frequently filtered fields
- No N+1 queries

#### NF-2: Reliability
- Internal tool — no formal uptime SLA; single-host deploy
- Data consistency (ACID compliance via PostgreSQL)
- Graceful degradation if Redmine unavailable
- Automatic backups (ops responsibility)
- Rollback capability on deploy

#### NF-3: Security
- Authentication: bcrypt password hashing (cost 12)
- Session: secure, httpOnly, SameSite cookies
- Authorization: RBAC middleware on protected routes
- Data: Encrypted Redmine keys at rest (AES-256-GCM)
- Secrets: Never committed; loaded from `.env.production`
- Audit: Complete mutation trail for compliance

#### NF-4: Scalability
- Horizontal scaling via container orchestration (future; currently single-host)
- Database: PostgreSQL with connection pooling
- Caching: Minimal (most queries fast; consider Redis for future dashboards)
- Rate limits: None enforced (internal tool)

#### NF-5: Maintainability
- Clean code (SOLID principles, DRY, KISS)
- Type safety (TypeScript strict mode)
- Pure `lib/` helpers covered by Vitest unit tests (no DB-bound tests)
- Documentation: README, code comments, inline JSDoc
- Conventional commits for clear history

#### NF-6: Usability
- Responsive design (mobile-first)
- Vietnamese UI (locale-aware formatting)
- Dark mode support
- Keyboard accessible (WCAG 2.1 AA target)
- Toast notifications for user feedback
- Clear error messages

---

### Technical Constraints

| Constraint | Rationale |
|-----------|-----------|
| Next.js 16.2.9 App Router (not Pages) | Modern framework; RSC for security; server-side auth |
| Prisma 7.8 with driver adapters | ORM abstraction; runtime adapter selection for dev/prod |
| SQLite dev / PostgreSQL prod | SQLite simplicity for local dev; PostgreSQL reliability for prod |
| TypeScript strict | Type safety; catch errors early |
| Zod validation | Schema validation; runtime type checking |
| Vitest for unit tests | Fast, modern, ESM-native |
| No external CMS or services | Internal tool; self-contained (except optional Redmine) |
| Single-host Docker Compose | Cost-effective; ops simplicity; vertical scaling sufficient for 20 users |
| Single Redmine instance (shared) | Company policy; users connect own API keys |

---

### Success Metrics (targets)

These are intended targets, not measured results — no formal metrics pipeline is in place yet.

| Metric | Target |
|--------|--------|
| Dashboard load time | < 2s |
| Report CSV export | < 5s |
| Mutation audit coverage | every create/update/delete logged |
| `lib/` helper tests | pure functions unit-tested (Vitest) |
| Deploys | zero-downtime container rebuild |

---

## Known Limitations & Future Work

### Current Limitations
- **Redmine sync:** Best-effort, no retry queue (manual button available)
- **E2E tests:** Playwright configured but suite not comprehensive
- **Offline mode:** Not supported (requires server always on)
- **Mobile app:** Web app only (responsive, but not native)
- **Batch operations:** Can't bulk-edit multiple entries at once
- **Audit log:** No export to external compliance systems

### Forward Priorities

| Priority | Feature | Rationale |
|----------|---------|-----------|
| High | Configurable min session length | Current 1 min may be too granular for some workflows |
| High | Broader audit coverage for reads | Export operations and sensitive report access |
| Medium | Async Redmine sync queue | Retry failed pushes without manual intervention |
| Medium | Offline time entry + sync | Support disconnected work scenarios |
| Medium | Salary advance / withholding adjustment UI | Manual payroll corrections currently require DB edit |
| Low | Mobile app (React Native or Flutter) | Web app sufficient for now; could revisit later |
| Low | Export to accounting software (Xero, Wave) | Manual CSV export currently sufficient |
| Low | Real-time multi-user sync (WebSocket) | Low priority; tool is read-heavy |

---

## Project Metadata

| Field | Value |
|-------|-------|
| **Owner** | 9stack team (internal tool) |
| **Active development** | 2026 |
| **Code Size** | ~6.7K LOC (app) + ~2.6K LOC (lib) + ~3.2K (components) + tests + migrations |
| **Languages** | TypeScript, SQL, Bash (deployment) |
| **Key Dependencies** | Next.js 16, React 19, Prisma 7, Tailwind 4, Recharts, TanStack Table |
| **Database** | PostgreSQL 17 (prod), SQLite (dev) |
| **Hosting** | Single Ubuntu 24.04 host via Docker Compose (see deployment-guide) |
| **Repository** | GitHub `9stack-ai/opentimesheet`; deploys via `git archive` over SSH |
| **CI/CD** | None configured; gates run locally (`tsc`, `eslint`, `vitest`) before deploy |
| **Monitoring** | Manual (ops checks `docker compose logs`, DB backups) |

---

## Version History

`package.json` is at version `0.1.0`. There is no separate release/tag history — the
authoritative change history is the git log (`git log --oneline`), which records each
feature/fix as a conventional commit.

---

## Sign-Off

**Last Updated:** 2026-06-22

This PDR reflects the current implemented state. Requirements marked ✅ are implemented
and in use. Items under "Forward Priorities" are candidates for future work, not commitments.
