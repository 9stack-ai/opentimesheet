import { prisma } from "@/lib/db";
import type { Period } from "@/lib/period";
import { approvedEntriesForPeriod } from "@/lib/reporting-db";
import { payoutByUser } from "@/lib/reporting";
import { compAt, wholeMonthsBetween } from "@/lib/compensation";

export type UserPayroll = {
  gross: number; // lương gộp (trước thuế) trong kỳ
  tax: number; // thuế TNCN giữ lại
  net: number; // thực nhận = gross − tax
};

/**
 * Per-user accrued payroll for the period (Map userId → {gross, tax, net}).
 * Hourly = approved timesheet (rate snapshotted per entry), EXCLUDING entries whose date falls in
 * a FIXED compensation period. Fixed = each FIXED Compensation's monthly salary × whole months of
 * that period overlapping the report period, taxed at that period's withholding rate. The two add up
 * across time (a user can be hourly some months and fixed others).
 */
export async function payrollByUser(period: Period): Promise<Map<string, UserPayroll>> {
  const [entries, fixedComps] = await Promise.all([
    approvedEntriesForPeriod(period),
    prisma.compensation.findMany({
      where: {
        kind: "FIXED",
        effectiveFrom: { lt: period.end },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: period.start } }],
      },
      select: {
        userId: true,
        effectiveFrom: true,
        effectiveTo: true,
        fixedMonthlySalary: true,
        taxWithholdingRateBps: true,
      },
    }),
  ]);

  const fixedByUser = new Map<string, typeof fixedComps>();
  for (const c of fixedComps) {
    const arr = fixedByUser.get(c.userId);
    if (arr) arr.push(c);
    else fixedByUser.set(c.userId, [c]);
  }

  const map = new Map<string, UserPayroll>();
  const add = (uid: string, gross: number, tax: number) => {
    const cur = map.get(uid) ?? { gross: 0, tax: 0, net: 0 };
    cur.gross += gross;
    cur.tax += tax;
    cur.net += gross - tax;
    map.set(uid, cur);
  };

  // Hourly: exclude entries whose date is inside a FIXED period (those months are salaried, not hourly).
  const hourlyEntries = entries.filter((e) => {
    const fc = fixedByUser.get(e.userId);
    return !fc || !compAt(fc, e.date);
  });
  for (const r of payoutByUser(hourlyEntries)) add(r.userId, r.gross, r.taxWithheld);

  // Fixed: salary × whole months of [from, to] overlapping the period (effectiveTo inclusive → +1 day).
  for (const c of fixedComps) {
    const startMs = Math.max(c.effectiveFrom.getTime(), period.start.getTime());
    const compEndMs = c.effectiveTo ? c.effectiveTo.getTime() + 86_400_000 : period.end.getTime();
    const endMs = Math.min(compEndMs, period.end.getTime());
    const months = wholeMonthsBetween(new Date(startMs), new Date(endMs));
    if (months <= 0) continue;
    const gross = c.fixedMonthlySalary * months;
    const tax = Math.round((gross * c.taxWithholdingRateBps) / 10000);
    add(c.userId, gross, tax);
  }

  return map;
}
