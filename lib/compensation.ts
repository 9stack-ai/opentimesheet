// Pure compensation-history helpers — no DB import, so unit-testable in isolation.
// A user's pay over time is a list of date-ranged Compensation periods (HOURLY or FIXED).

export type Comp = {
  effectiveFrom: Date;
  effectiveTo: Date | null; // null = open-ended (current)
  kind: string; // "HOURLY" | "FIXED"
  costRate: number;
  billableRate: number;
  fixedMonthlySalary: number;
  taxWithholdingRateBps: number;
  employerCostRateBps: number;
};

/** The compensation period covering `date` (from ≤ date ≤ to|∞); newest effectiveFrom wins on overlap. */
export function compAt<T extends { effectiveFrom: Date; effectiveTo: Date | null }>(
  comps: T[],
  date: Date,
): T | null {
  const t = date.getTime();
  let best: T | null = null;
  for (const c of comps) {
    if (c.effectiveFrom.getTime() <= t && (c.effectiveTo === null || t <= c.effectiveTo.getTime())) {
      if (!best || c.effectiveFrom.getTime() > best.effectiveFrom.getTime()) best = c;
    }
  }
  return best;
}

/** Whole calendar months whose 1st falls in [start, end). A partial leading month is skipped. */
export function wholeMonthsBetween(start: Date, end: Date): number {
  if (end.getTime() <= start.getTime()) return 0;
  const y = start.getUTCFullYear();
  let m = start.getUTCMonth();
  if (Date.UTC(y, m, 1) < start.getTime()) m += 1; // skip partial leading month
  let count = 0;
  while (Date.UTC(y, m + count, 1) < end.getTime()) count++;
  return count;
}
