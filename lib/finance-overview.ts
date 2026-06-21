import { prisma } from "@/lib/db";
import { approvedEntriesForPeriod, fixedCostsTotalForPeriod } from "@/lib/reporting-db";
import type { Period } from "@/lib/period";

// Consolidated cash-in / cash-out for a period (Thu – Chi).
// Income = client-billable revenue from approved time.
// Expense = staff payout + regular expenses + irregular expenses + fixed costs.
// net here equals profitability company.net, just broken down for the overview.
export type FinanceOverview = {
  revenue: number; // Tổng thu
  payout: number; // Chi trả nhân sự
  regularExpense: number; // Chi phí thường
  irregularExpense: number; // Chi bất thường
  fixedCost: number; // Chi phí cố định
  expenseTotal: number; // Tổng chi
  net: number; // Số dư = Thu − Chi
};

export async function financeOverview(period: Period): Promise<FinanceOverview> {
  const [entries, fixedCost, expenses] = await Promise.all([
    approvedEntriesForPeriod(period),
    fixedCostsTotalForPeriod(period),
    prisma.expense.findMany({
      where: { date: { gte: period.start, lt: period.end } },
      select: { amount: true, kind: true },
    }),
  ]);

  const revenue = Math.round(entries.reduce((s, e) => s + e.hours * e.billableRateSnapshot, 0));
  const payout = Math.round(entries.reduce((s, e) => s + e.hours * e.costRateSnapshot, 0));

  let regularExpense = 0;
  let irregularExpense = 0;
  for (const e of expenses) {
    if (e.kind === "IRREGULAR") irregularExpense += e.amount;
    else regularExpense += e.amount;
  }

  const expenseTotal = payout + regularExpense + irregularExpense + fixedCost;
  return {
    revenue,
    payout,
    regularExpense,
    irregularExpense,
    fixedCost,
    expenseTotal,
    net: revenue - expenseTotal,
  };
}
