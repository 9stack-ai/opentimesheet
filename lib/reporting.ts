// Pure reporting aggregations — no DB import, so unit-testable in isolation.
// All money is integer VND; rounding happens at the per-user total ("round at total").

export type ApprovedEntry = {
  userId: string;
  userName: string;
  date: Date;
  hours: number;
  costRateSnapshot: number;
  billableRateSnapshot: number;
  // Tax rates frozen at approval (basis points; 0 for legacy/unset).
  taxRateSnapshot: number;
  employerCostRateSnapshot: number;
  projectId: string;
  projectName: string;
  clientId: string;
  clientName: string;
};

export type PayoutRow = {
  userId: string;
  userName: string;
  totalHours: number;
  /** Gross labor cost (trước thuế) = Σ hours × costRateSnapshot. */
  gross: number;
  /** PIT withheld (thuế giữ lại). */
  taxWithheld: number;
  /** Net actually transferred to the person (thực nhận) = gross − taxWithheld. */
  net: number;
  /** Employer-side insurance — additional company cost (BH công ty). */
  employerCost: number;
  /** Total company outlay for this person = gross + employerCost. */
  totalCompanyCost: number;
};

/**
 * Per-user payout broken into gross / tax-withheld / net / employer-cost.
 * Withholding is computed per entry (rates can differ between approvals) then rounded once at the
 * total; net = roundedGross − roundedTax so the columns reconcile exactly.
 */
export function payoutByUser(entries: ApprovedEntry[]): PayoutRow[] {
  const map = new Map<
    string,
    { userName: string; totalHours: number; grossRaw: number; taxRaw: number; employerRaw: number }
  >();
  for (const e of entries) {
    const row =
      map.get(e.userId) ??
      { userName: e.userName, totalHours: 0, grossRaw: 0, taxRaw: 0, employerRaw: 0 };
    const entryGross = e.hours * e.costRateSnapshot;
    row.totalHours += e.hours;
    row.grossRaw += entryGross;
    // Accumulate raw (unrounded) per-entry amounts; rates differ per entry so keep them inside Σ.
    row.taxRaw += (entryGross * e.taxRateSnapshot) / 10000;
    row.employerRaw += (entryGross * e.employerCostRateSnapshot) / 10000;
    map.set(e.userId, row);
  }
  return Array.from(map.entries())
    .map(([userId, r]) => {
      const gross = Math.round(r.grossRaw);
      const taxWithheld = Math.round(r.taxRaw);
      const employerCostTotal = Math.round(r.employerRaw);
      return {
        userId,
        userName: r.userName,
        totalHours: r.totalHours,
        gross,
        taxWithheld,
        net: gross - taxWithheld,
        employerCost: employerCostTotal,
        totalCompanyCost: gross + employerCostTotal,
      };
    })
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

/** Total monthly fixed costs accrued over a period: each cost counts once per whole
 *  calendar month in [start, end) that it is active — so a month ≈ 1×, a quarter ≈ 3×,
 *  a year ≈ 12×. A sub-month (weekly) range only counts whole months it fully covers, so
 *  a mid-month week contributes 0. */
export function totalFixedCostsForPeriod(
  fixedCosts: FixedCostInput[],
  periodStart: Date,
  periodEnd: Date,
): number {
  const months: { start: Date; end: Date }[] = [];
  let m = periodStart.getUTCMonth();
  const y = periodStart.getUTCFullYear();
  if (Date.UTC(y, m, 1) < periodStart.getTime()) m += 1; // skip a partial leading month
  for (;;) {
    const start = new Date(Date.UTC(y, m, 1)); // Date.UTC rolls month/year over
    if (start.getTime() >= periodEnd.getTime()) break;
    months.push({ start, end: new Date(Date.UTC(y, m + 1, 1)) });
    m += 1;
  }

  let total = 0;
  for (const fc of fixedCosts) {
    for (const mo of months) {
      if (fixedCostActiveInPeriod(fc, mo.start, mo.end)) total += fc.monthlyAmount;
    }
  }
  return total;
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
