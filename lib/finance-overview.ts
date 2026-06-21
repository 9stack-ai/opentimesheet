import { prisma } from "@/lib/db";
import { approvedEntriesForPeriod, fixedCostsTotalForPeriod } from "@/lib/reporting-db";
import type { Period } from "@/lib/period";

// Consolidated cash-in / cash-out for a period (Thu – Chi).
// Income = client-billable revenue from approved time + other cash-in (Income ledger:
// capital contributions, client advances, milestone payments dated in the period).
// Expense = gross staff payout + employer insurance + regular + irregular expenses + fixed costs.
export type FinanceOverview = {
  revenue: number; // Doanh thu billable (từ công đã duyệt)
  otherIncome: number; // Nguồn thu khác (ledger Income trong kỳ)
  incomeTotal: number; // Tổng thu = revenue + otherIncome
  payout: number; // Chi trả nhân sự (gross — gồm phần thuế giữ lại nộp hộ)
  employerInsurance: number; // BH công ty đóng (chi phí cộng thêm cho nhân viên)
  regularExpense: number; // Chi phí thường
  irregularExpense: number; // Chi bất thường
  fixedCost: number; // Chi phí cố định
  expenseTotal: number; // Tổng chi
  net: number; // Số dư = Tổng thu − Tổng chi
};

export async function financeOverview(period: Period): Promise<FinanceOverview> {
  const [entries, fixedCost, expenses, incomes] = await Promise.all([
    approvedEntriesForPeriod(period),
    fixedCostsTotalForPeriod(period),
    prisma.expense.findMany({
      where: { date: { gte: period.start, lt: period.end } },
      select: { amount: true, kind: true },
    }),
    // Undated income (date = null) is intentionally excluded from any period.
    prisma.income.findMany({
      where: { date: { gte: period.start, lt: period.end } },
      select: { amount: true },
    }),
  ]);

  const revenue = Math.round(entries.reduce((s, e) => s + e.hours * e.billableRateSnapshot, 0));
  const otherIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const incomeTotal = revenue + otherIncome;
  const payout = Math.round(entries.reduce((s, e) => s + e.hours * e.costRateSnapshot, 0));
  // Employer-side insurance is an additional company cash-out on top of gross payout.
  const employerInsurance = Math.round(
    entries.reduce((s, e) => s + (e.hours * e.costRateSnapshot * e.employerCostRateSnapshot) / 10000, 0),
  );

  let regularExpense = 0;
  let irregularExpense = 0;
  for (const e of expenses) {
    if (e.kind === "IRREGULAR") irregularExpense += e.amount;
    else regularExpense += e.amount;
  }

  const expenseTotal = payout + employerInsurance + regularExpense + irregularExpense + fixedCost;
  return {
    revenue,
    otherIncome,
    incomeTotal,
    payout,
    employerInsurance,
    regularExpense,
    irregularExpense,
    fixedCost,
    expenseTotal,
    net: incomeTotal - expenseTotal,
  };
}
