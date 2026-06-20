// Pure reporting aggregations — no DB import, so unit-testable in isolation.
// All money is integer VND; rounding happens at the per-user total ("round at total").

export type ApprovedEntry = {
  userId: string;
  userName: string;
  hours: number;
  costRateSnapshot: number;
  billableRateSnapshot: number;
  projectId: string;
  projectName: string;
  clientId: string;
  clientName: string;
};

export type PayoutRow = {
  userId: string;
  userName: string;
  totalHours: number;
  payout: number;
};

/** Σ(hours × costRateSnapshot) per user, rounded once at the total. */
export function payoutByUser(entries: ApprovedEntry[]): PayoutRow[] {
  const map = new Map<string, { userName: string; totalHours: number; payoutRaw: number }>();
  for (const e of entries) {
    const row = map.get(e.userId) ?? { userName: e.userName, totalHours: 0, payoutRaw: 0 };
    row.totalHours += e.hours;
    row.payoutRaw += e.hours * e.costRateSnapshot;
    map.set(e.userId, row);
  }
  return Array.from(map.entries())
    .map(([userId, r]) => ({
      userId,
      userName: r.userName,
      totalHours: r.totalHours,
      payout: Math.round(r.payoutRaw),
    }))
    .sort((a, b) => a.userName.localeCompare(b.userName));
}

export type FixedCostInput = {
  monthlyAmount: number;
  effectiveFrom: Date;
  effectiveTo: Date | null;
};

/** A monthly fixed cost is active in a period when its [from, to] range overlaps [start, end). */
export function fixedCostActiveInPeriod(fc: FixedCostInput, periodStart: Date, periodEnd: Date): boolean {
  const startsBeforeEnd = fc.effectiveFrom.getTime() < periodEnd.getTime();
  const endsAfterStart = fc.effectiveTo === null || fc.effectiveTo.getTime() >= periodStart.getTime();
  return startsBeforeEnd && endsAfterStart;
}

/** Sum of monthlyAmount for fixed costs active in the period (counted once; monthly periods). */
export function totalFixedCostsForPeriod(
  fixedCosts: FixedCostInput[],
  periodStart: Date,
  periodEnd: Date,
): number {
  return fixedCosts
    .filter((fc) => fixedCostActiveInPeriod(fc, periodStart, periodEnd))
    .reduce((sum, fc) => sum + fc.monthlyAmount, 0);
}

export type BillingProjectRow = {
  projectId: string;
  projectName: string;
  hours: number;
  revenue: number;
};

export type BillingClientRow = {
  clientId: string;
  clientName: string;
  hours: number;
  revenue: number;
  projects: BillingProjectRow[];
};

/** Σ(hours × billableRateSnapshot) grouped by client → project, rounded at each total. */
export function billingByClient(entries: ApprovedEntry[]): BillingClientRow[] {
  type Acc = { name: string; hours: number; revenueRaw: number };
  const clients = new Map<string, Acc & { projects: Map<string, Acc> }>();

  for (const e of entries) {
    const c = clients.get(e.clientId) ?? { name: e.clientName, hours: 0, revenueRaw: 0, projects: new Map() };
    c.hours += e.hours;
    c.revenueRaw += e.hours * e.billableRateSnapshot;
    const p = c.projects.get(e.projectId) ?? { name: e.projectName, hours: 0, revenueRaw: 0 };
    p.hours += e.hours;
    p.revenueRaw += e.hours * e.billableRateSnapshot;
    c.projects.set(e.projectId, p);
    clients.set(e.clientId, c);
  }

  return Array.from(clients.entries())
    .map(([clientId, c]) => ({
      clientId,
      clientName: c.name,
      hours: c.hours,
      revenue: Math.round(c.revenueRaw),
      projects: Array.from(c.projects.entries())
        .map(([projectId, p]) => ({
          projectId,
          projectName: p.name,
          hours: p.hours,
          revenue: Math.round(p.revenueRaw),
        }))
        .sort((a, b) => a.projectName.localeCompare(b.projectName)),
    }))
    .sort((a, b) => a.clientName.localeCompare(b.clientName));
}
