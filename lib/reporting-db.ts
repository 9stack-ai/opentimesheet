import { prisma } from "@/lib/db";
import type { Period } from "@/lib/period";
import { totalFixedCostsForPeriod, type ApprovedEntry } from "@/lib/reporting";

/** Approved time entries within a period, flattened for the pure aggregators. */
export async function approvedEntriesForPeriod(period: Period): Promise<ApprovedEntry[]> {
  const rows = await prisma.timeEntry.findMany({
    where: { status: "APPROVED", date: { gte: period.start, lt: period.end } },
    include: {
      user: { select: { name: true } },
      task: { include: { project: { include: { client: true } } } },
    },
  });
  return rows.map((e) => ({
    userId: e.userId,
    userName: e.user.name,
    hours: Number(e.hours),
    costRateSnapshot: e.costRateSnapshot ?? 0,
    billableRateSnapshot: e.billableRateSnapshot ?? 0,
    projectId: e.task.projectId,
    projectName: e.task.project.name,
    clientId: e.task.project.clientId,
    clientName: e.task.project.client.name,
  }));
}

export async function fixedCostsTotalForPeriod(period: Period): Promise<number> {
  const all = await prisma.fixedCost.findMany({
    select: { monthlyAmount: true, effectiveFrom: true, effectiveTo: true },
  });
  return totalFixedCostsForPeriod(all, period.start, period.end);
}

export type PeriodExpenses = {
  projectExpenses: Map<string, number>;
  companyTotal: number;
  total: number;
};

export async function expensesForPeriod(period: Period): Promise<PeriodExpenses> {
  const rows = await prisma.expense.findMany({
    where: { date: { gte: period.start, lt: period.end } },
    select: { projectId: true, amount: true },
  });
  const projectExpenses = new Map<string, number>();
  let companyTotal = 0;
  let total = 0;
  for (const r of rows) {
    total += r.amount;
    if (r.projectId) {
      projectExpenses.set(r.projectId, (projectExpenses.get(r.projectId) ?? 0) + r.amount);
    } else {
      companyTotal += r.amount;
    }
  }
  return { projectExpenses, companyTotal, total };
}
