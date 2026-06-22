# Project Roadmap — 9stimesheet

Current state (2026) and forward direction. Shipped features marked ✅; planned items are candidates for future work — no committed dates or scope.

---

## Current State (2026)

### Shipped & Stable ✅

**Core Timesheet & Approval**
- ✅ Manual time entry (date, hours, task, note)
- ✅ Live work session timer (start/stop, min 1 min, max 4h, 15-min rounding)
- ✅ Status workflow (DRAFT → SUBMITTED → APPROVED/REJECTED)
- ✅ Batch approval UI with visual status indicators
- ✅ Admin on-behalf logging (retroactive entries, sick leave makeup)
- ✅ Rate snapshots frozen at approval (cost, billable, tax, employer cost)

**Project & Client Management**
- ✅ Client → Project → Task hierarchy
- ✅ Per-project rate overrides (Assignment model)
- ✅ Archive/activate projects
- ✅ User assignment to projects with role support

**Financial Reporting**
- ✅ Finance overview (cash model KPIs: income, expenses, net, payroll debt)
- ✅ Payout report (gross, tax, net per user, team-wide or individual)
- ✅ Billing report (revenue by client)
- ✅ Profitability report (project margins with fixed-cost allocation)
- ✅ CSV exports for all reports

**Payroll & Tax**
- ✅ PIT withholding calculation (basis points, frozen at approval)
- ✅ Employer insurance cost (basis points, frozen at approval)
- ✅ User-level default rates
- ✅ Per-project rate overrides
- ✅ Tax rate snapshots for historical accuracy

**Expense & Income Tracking**
- ✅ Regular & irregular (bất thường) expenses
- ✅ Project-scoped or company-level expenses
- ✅ Income sources (free-text, optional project assignment)
- ✅ Fixed monthly costs with effective date ranges

**Disbursements**
- ✅ Record actual cash paid to users (thực chi)
- ✅ Tied to salary period ("YYYY-MM" for reconciliation)
- ✅ Separate from TimeEntry-derived payout
- ✅ Reconciliation view (compare disbursed vs. earned)

**Redmine Integration** (Optional Feature)
- ✅ Per-user encrypted API key storage
- ✅ Manager maps app Project to Redmine project ID
- ✅ Sync Redmine issues → Tasks (pull)
- ✅ Push approved time → Redmine (idempotent, best-effort)
- ✅ Status tracking (pending, pushing, pushed, failed, skipped)
- ✅ Manual retry UI for failed pushes
- ✅ Feature dormant if REDMINE_URL not set

**Admin & User Management**
- ✅ User CRUD (create, enable/disable, set role)
- ✅ Batch invite with secure tokens (24h expiry)
- ✅ Password set flow for invited users
- ✅ Per-user tax & insurance rate configuration
- ✅ Role management (ADMIN, MANAGER, EMPLOYEE, FREELANCER)

**Audit & Compliance**
- ✅ Denormalized audit log (action, actor, target, timestamp, Vietnamese summary)
- ✅ Queryable by action, actor, date range, target
- ✅ Admin UI at `/admin/audit`
- ✅ Searchable with filters

**Dashboard & UX**
- ✅ Manager KPI dashboard (income, expenses, net, team hours)
- ✅ Freelancer hours chart (by project, period-filtered)
- ✅ Period navigation (week, month, quarter, half, year, all-time)
- ✅ Dark mode support (next-themes)
- ✅ Vietnamese localization (formatting, labels)
- ✅ Toast notifications (Sonner)
- ✅ Responsive design (mobile-first, Tailwind v4)

**Authentication & Security**
- ✅ Credentials-based auth (email + password, bcrypt hashing)
- ✅ Secure session cookies (httpOnly, SameSite, Secure in prod)
- ✅ RBAC middleware (protects `/admin`, `/manager`)
- ✅ Redmine API key encryption (AES-256-GCM)

**Testing & Quality**
- ✅ Unit tests (Vitest, 10 files, ~500 LOC)
- ✅ E2E tests (Playwright, configured, basic stubs)
- ✅ ESLint + TypeScript strict mode
- ✅ Schema parity enforcement (dev/prod schemas)
- ✅ Code coverage ≥80% for lib functions

**Deployment**
- ✅ Docker Compose (single host: Caddy, app, PostgreSQL)
- ✅ Automatic TLS (Let's Encrypt via Caddy)
- ✅ Git-based deploy (tar + SSH + docker compose up)
- ✅ Secrets via `.env.production`
- ✅ Bootstrap admin on first start
- ✅ Database provisioning via `prisma db push`

---

## Known Limitations

| Limitation | Impact | Workaround |
|-----------|--------|-----------|
| **Redmine sync:** Best-effort, no retry queue | Failed pushes require manual button click | Press "Retry" button in UI |
| **E2E tests:** Playwright configured but not comprehensive | Basic flows untested | Manual QA for workflows |
| **Offline mode:** Not supported | Requires server connection for every action | Always online (internal tool) |
| **Mobile app:** Web app only | No native app; responsive web | Web app sufficient for most use cases |
| **Bulk operations:** Can't multi-select & edit entries | One-by-one editing is slow for large batches | Manual editing or DB update |
| **Audit export:** No compliance system export | Audit trail locked in DB | Manual CSV export (future feature) |
| **Min session length:** Hard-coded 1 minute | May be too granular for some workflows | Discuss with team, parameterize if needed |
| **No rate change history:** Rate updates overwrite | Can't see when rates were changed | Audit log has action, but not old value (future enhancement) |

---

## Forward Priorities

### Phase 1: Robustness & Reliability (candidate — unscheduled)

**Objective:** Stabilize for scaling, improve ops visibility.

| Feature | Priority | Effort | Rationale | Success Metric |
|---------|----------|--------|-----------|-----------------|
| Comprehensive E2E test suite | High | 1-2w | Catch regressions early; increase confidence in deploys | ≥15 test scenarios covering login, timesheet flow, approval, reports |
| Async Redmine sync queue | High | 1-2w | Reduce manual retries; auto-retry failed pushes | 0 manual retries needed per month |
| Broader audit log coverage | Medium | 3-5d | Track sensitive reads (exports, report access) | Audit log covers ≥95% of mutations + key reads |
| Database query logging & analysis | Medium | 3-5d | Detect slow queries; optimize hot paths | Identify & document top 5 slow queries |
| Error rate monitoring (Sentry or similar) | Medium | 2-3d | Catch production errors in real-time | <0.1% error rate maintained |

**Deliverables:**
- E2E test suite (login → submit → approve → export CSV workflows)
- Async queue for Redmine retries (consider Bull or similar)
- Expanded audit scope (read operations on sensitive screens)
- Query performance baseline & optimization plan
- Monitoring dashboard (error rates, response times)

**Definition of Done:**
- All E2E tests pass in CI
- Zero manual Redmine retries over 2-week period
- Audit log covers key reads
- Slow queries identified & documented
- Production error rate monitored in real-time

---

### Phase 2: Usability & Workflows (candidate — unscheduled)

**Objective:** Reduce friction in common workflows; enable offline work.

| Feature | Priority | Effort | Rationale | Success Metric |
|---------|----------|--------|-----------|-----------------|
| Configurable min session length | Medium | 2-3d | 1 min may be too granular; support 5/15/30 min blocks | Min length configurable per team preference |
| Offline time entry + sync | Medium | 1-2w | Support disconnected work (field teams); sync when back online | Time entries logged offline sync correctly; no data loss |
| Batch time entry import (CSV) | Medium | 3-5d | Fast data load for retroactive entries or migrations | Import CSV with date, hours, note, task; validate & batch create |
| Salary advance / withholding adjustment UI | Low | 3-5d | Manual payroll corrections without DB access | Managers can adjust salary advances & withholding per user, period |
| Period-filtered dashboard filters (client, project, user) | Low | 3-5d | Narrow KPI view to specific scope | Dashboard filters by client, project, user; updates KPIs |

**Deliverables:**
- Admin config UI for min session length
- PWA service worker + offline cache for timesheet page
- CSV import route & validation flow
- Salary adjustment UI (manager only)
- Dashboard filter controls

**Definition of Done:**
- Min session length configurable
- Offline entries sync & show in reports (no loss)
- CSV import handles 100+ rows with validation
- Adjustments audit-logged & reflected in reports
- Filters work & update KPIs in real-time

---

### Phase 3: Scale & Integration (candidate — unscheduled)

**Objective:** Support growth; integrate with external systems.

| Feature | Priority | Effort | Rationale | Success Metric |
|---------|----------|--------|-----------|-----------------|
| Export to accounting software (Xero, Wave) | Medium | 2w | Automate financial reconciliation; reduce manual entry | Monthly reconciliation <1 hour vs. current 2-3 hours |
| Real-time multi-user sync (WebSocket) | Low | 1-2w | Admins see live updates when managers approve; optional feature | Admin dashboard updates within 2s of approval |
| Mobile app (React Native or Flutter) | Low | 4-6w | Native app for time entry on-the-go; current responsive web sufficient | Pilot on 3-5 users; measure engagement |
| Bulk time entry operations (edit, delete, move) | Low | 1w | Speed up corrections for multiple entries | Multi-select & batch edit 10+ entries in <1 min |
| Rate change history & audit | Medium | 1w | Track when rates changed, by whom, for compliance | Rate change log queryable; shows old → new values |
| Salary settlement reports (cumulative, by period) | Low | 3-5d | Help finance team track employee payroll debt | Settlement report shows gross, tax, net, disbursed, balance |

**Deliverables:**
- Accounting software export integration (Xero API, Wave API)
- WebSocket sync setup (socket.io or similar)
- React Native prototype or Flutter spike
- Bulk operation UI (multi-select, batch edit)
- Rate change audit trail
- Settlement report template & queries

**Definition of Done:**
- Accounting exports reduce reconciliation time by 50%
- Live sync demo working with 5+ concurrent users
- Mobile app tested on 3+ devices (or prototype completed)
- Bulk ops handle 50+ entries per batch
- Rate changes tracked with actor, timestamp, old/new values
- Settlement report matches manual calculation

---

### Phase 4: Advanced Features (2026, future)

**Objective:** Premium features for larger teams; operational excellence.

| Feature | Priority | Effort | Rationale |
|---------|----------|--------|-----------|
| **Real-time dashboards** | Low | 2-3w | Managers see live team activity; WebSocket + caching |
| **Predictive payroll forecasting** | Low | 2w | Estimate payroll debt using trend analysis |
| **Time entry templates** | Low | 1w | Reuse common task/note combos; auto-fill entry |
| **Geolocation tracking** (optional) | Low | 1-2w | For field teams; optional, privacy-respecting |
| **Compliance export** (audit trail to external system) | Low | 1w | Export audit logs to compliance platform (Vanta, etc.) |
| **Timesheet approvers workflow** | Low | 1w | Route approvals to assigned reviewer; escalation |
| **Workload balancing** | Low | 2w | Recommend project assignments based on utilization |
| **Team member onboarding workflow** | Low | 1w | Guided setup: create user → configure rates → assign projects |
| **Mobile app v2** (full feature parity) | Low | 6-8w | Complete native app for iOS/Android if Phase 3 pilot succeeds |

---

## Technical Debt & Hardening

### Current Issues to Address (unscheduled)
| Issue | Severity | Fix |
|-------|----------|-----|
| **Redmine retry logic:** manual only | Medium | Implement async retry queue (Phase 1) |
| **E2E test gaps:** Playwright configured, suite not comprehensive | Medium | Add E2E suite (Phase 1) |
| **Schema push vs. migrations:** dev uses migrations, prod uses `db push` | Low | Decide on a single strategy; document |
| **Rate snapshot edge case:** null rate/tax snapshots on legacy entries | Low | Treated as 0 in reports; backfill if needed |
| **Audit log read coverage:** mutations only, no read auditing | Low | Expand to sensitive reads/exports if required |

---

## Goals (qualitative)

No formal OKRs or measured metrics are tracked yet. Working goals:

- Keep historical payroll/finance numbers stable (rate & tax snapshots frozen at approval).
- Every data mutation is audit-logged.
- Dev/prod schema parity stays green (`schema-parity.test.ts`).
- Deploys are zero-downtime container rebuilds with no data loss.

---

## Dependency & Risk Analysis

### External Dependencies
| Dependency | Risk | Mitigation |
|-----------|------|-----------|
| **Redmine API** | Instance outage blocks sync | Best-effort retries; timesheet works offline |
| **PostgreSQL** | Database corruption | Daily backups; test restore procedure |
| **Let's Encrypt** | TLS renewal failure | Monitor cert expiry; Caddy handles auto-renewal |
| **Auth.js v5 (beta)** | API changes, stability | Pin version; monitor releases; test upgrades |

### Technical Risks
| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Schema divergence (dev/prod)** | Data model misalignment | `schema-parity.test.ts` enforces sync |
| **Rate snapshot bugs** | Wrong historical payroll | Test all rate snapshot paths; code review all changes |
| **Concurrent approvals** | Race condition on entry | Use DB transactions; test concurrent ops |
| **Large CSV export** | Memory spike | Stream CSV response; pagination if >100k rows |

### Scaling Risks
| Scenario | Current Limit | Action |
|----------|---------------|--------|
| 50+ users | Single host sufficient | Monitor DB CPU/memory; consider replication at 100+ users |
| 1M+ time entries | Queries may slow | Add indexes; consider materialized views for reports |
| Concurrent approvals | <10 simultaneous | Connection pooling adequate; test at 50 |

---

## Release History

`package.json` is at `0.1.0` and there are no release tags — the authoritative history is the
git log (conventional commits). Use `git log --oneline` for the change record.

---

## Contributing

Repository: `9stack-ai/opentimesheet` (GitHub). Workflow:

1. Branch from `main` for any change.
2. Implement; add Vitest tests for new pure `lib/` helpers; keep `schema.prisma` and
   `schema.prod.prisma` in parity.
3. Run gates: `pnpm exec tsc --noEmit` · `pnpm exec eslint .` · `pnpm exec vitest run`.
4. Conventional commits (no AI references).
5. Deploy from `main` per `docs/deployment-guide.md`.

See `docs/code-standards.md` for patterns and conventions.

---

## Sign-Off

**Last Updated:** 2026-06-22

This roadmap lists candidates, not commitments. Shipped features (✅) are in use; forward items
are unscheduled and may change.
