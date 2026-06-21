import { prisma } from "@/lib/db";
import { nowSaigon } from "@/lib/clock";
import { monthPeriod, type Period } from "@/lib/period";
import { financeOverview } from "@/lib/finance-overview";

export type FinancePoint = { label: string; revenue: number; cost: number; net: number };
export type HoursPoint = { label: string; hours: number };
export type ManagerKpis = {
  income: number; // Nguồn thu
  actualNet: number; // Số dư thực tế (Nguồn thu − Thực chi − Chi phí)
  projectedNet: number; // Số dư dự kiến (sau tạm tính lương)
  unpaidPayroll: number; // Đang chờ chi = lương tạm tính − đã thực chi
  activeProjects: number;
};

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

/** Last N months of actual cash flow (Nguồn thu / Chi thực / Số dư) for the manager chart. */
export async function managerMonthlyFinance(n = 6): Promise<FinancePoint[]> {
  const months = lastNMonths(n);
  return Promise.all(
    months.map(async (mo) => {
      const f = await financeOverview(monthPeriod(mo.year, mo.month));
      return {
        label: mo.label,
        revenue: f.income,
        cost: f.disbursed + f.expenseTotal,
        net: f.actualNet,
      };
    }),
  );
}

/** KPIs for managers over the given period — from the cash model (Nguồn thu / Thực chi / tạm tính). */
export async function managerKpis(period: Period): Promise<ManagerKpis> {
  const [f, activeProjects] = await Promise.all([
    financeOverview(period),
    prisma.project.count({ where: { status: "ACTIVE" } }),
  ]);
  return {
    income: f.income,
    actualNet: f.actualNet,
    projectedNet: f.projectedNet,
    unpaidPayroll: f.unpaidPayroll,
    activeProjects,
  };
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
