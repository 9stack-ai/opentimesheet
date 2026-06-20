import { prisma } from "@/lib/db";
import { nowSaigon } from "@/lib/clock";
import { monthPeriod } from "@/lib/period";
import { profitabilityForPeriod } from "@/lib/profitability-db";
import { approvedEntriesForPeriod } from "@/lib/reporting-db";

export type FinancePoint = { label: string; revenue: number; cost: number; net: number };
export type HoursPoint = { label: string; hours: number };
export type ManagerKpis = { revenue: number; payout: number; net: number; activeProjects: number };

function lastNMonths(n: number): { year: number; month: number; label: string }[] {
  const now = nowSaigon();
  const baseYear = now.getUTCFullYear();
  const baseMonth = now.getUTCMonth() + 1; // 1..12
  const out: { year: number; month: number; label: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    let month = baseMonth - i;
    let year = baseYear;
    while (month <= 0) {
      month += 12;
      year -= 1;
    }
    out.push({ year, month, label: `Th${month}` });
  }
  return out;
}

/** Last N months of company revenue / total cost / net (for the manager finance chart). */
export async function managerMonthlyFinance(n = 6): Promise<FinancePoint[]> {
  const months = lastNMonths(n);
  return Promise.all(
    months.map(async (mo) => {
      const p = await profitabilityForPeriod(monthPeriod(mo.year, mo.month));
      const revenue = p.company.revenue;
      const net = p.company.net;
      return { label: mo.label, revenue, cost: revenue - net, net };
    }),
  );
}

/** Current-month KPIs for managers. */
export async function managerKpis(): Promise<ManagerKpis> {
  const now = nowSaigon();
  const period = monthPeriod(now.getUTCFullYear(), now.getUTCMonth() + 1);
  const [p, entries, activeProjects] = await Promise.all([
    profitabilityForPeriod(period),
    approvedEntriesForPeriod(period),
    prisma.project.count({ where: { status: "ACTIVE" } }),
  ]);
  const payout = Math.round(entries.reduce((s, e) => s + e.hours * e.costRateSnapshot, 0));
  return { revenue: p.company.revenue, payout, net: p.company.net, activeProjects };
}

/** Last N months of approved hours for a freelancer. */
export async function freelancerMonthlyHours(userId: string, n = 6): Promise<HoursPoint[]> {
  const months = lastNMonths(n);
  return Promise.all(
    months.map(async (mo) => {
      const period = monthPeriod(mo.year, mo.month);
      const agg = await prisma.timeEntry.aggregate({
        where: { userId, status: "APPROVED", date: { gte: period.start, lt: period.end } },
        _sum: { hours: true },
      });
      return { label: mo.label, hours: Number(agg._sum.hours ?? 0) };
    }),
  );
}
