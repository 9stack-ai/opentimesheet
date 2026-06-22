import { prisma } from "@/lib/db";
import type { Period } from "@/lib/period";
import { approvedEntriesForPeriod } from "@/lib/reporting-db";
import { payoutByUser } from "@/lib/reporting";

export type UserPayroll = {
  gross: number; // lương gộp (trước thuế) trong kỳ
  tax: number; // thuế TNCN giữ lại
  net: number; // thực nhận = gross − tax
};

/** Whole calendar months overlapping the period, annualized-capped at 12 so the all-time
 *  period doesn't multiply a monthly salary by hundreds of months. Week (sub-month) → 0. */
export function monthsInPeriod(period: Period): number {
  const end = period.end.getTime();
  const capStart = Date.UTC(period.end.getUTCFullYear(), period.end.getUTCMonth() - 12, 1);
  const startMs = Math.max(period.start.getTime(), capStart);
  const d = new Date(startMs);
  const y = d.getUTCFullYear();
  let m = d.getUTCMonth();
  if (Date.UTC(y, m, 1) < startMs) m += 1; // skip a partial leading month
  let count = 0;
  while (Date.UTC(y, m + count, 1) < end) count++;
  return count;
}

/**
 * Per-user accrued payroll for the period as a Map(userId → {gross, tax, net}).
 * Hourly users come from approved timesheet (payoutByUser). Fixed-salary users
 * (User.fixedMonthlySalary > 0) are paid `fixed × monthsInPeriod` as GROSS, taxed at their
 * own withholding rate — this OVERRIDES any hourly figure (they're salaried, not hourly).
 */
export async function payrollByUser(period: Period): Promise<Map<string, UserPayroll>> {
  const [entries, fixedUsers] = await Promise.all([
    approvedEntriesForPeriod(period),
    prisma.user.findMany({
      where: { fixedMonthlySalary: { gt: 0 } },
      select: { id: true, fixedMonthlySalary: true, taxWithholdingRateBps: true },
    }),
  ]);

  const map = new Map<string, UserPayroll>();
  for (const r of payoutByUser(entries)) {
    map.set(r.userId, { gross: r.gross, tax: r.taxWithheld, net: r.net });
  }

  const months = monthsInPeriod(period);
  for (const u of fixedUsers) {
    const gross = u.fixedMonthlySalary * months;
    const tax = Math.round((gross * u.taxWithholdingRateBps) / 10000);
    map.set(u.id, { gross, tax, net: gross - tax }); // fixed salary replaces hourly
  }
  return map;
}
