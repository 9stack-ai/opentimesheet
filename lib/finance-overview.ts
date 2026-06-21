import { prisma } from "@/lib/db";
import { approvedEntriesForPeriod, fixedCostsTotalForPeriod } from "@/lib/reporting-db";
import { payoutByUser } from "@/lib/reporting";
import type { Period } from "@/lib/period";

// Thu chi built from three sources:
//   • Nguồn thu (Income ledger)      → actual cash in
//   • Thực chi (Disbursement ledger) → actual cash out to people
//   • Tạm tính (approved timesheet)  → accrued payroll we still owe
// "Thực tế" = cash basis (income − disbursed − operating expenses).
// "Dự kiến" = accrual basis (income − full accrued payroll & insurance − operating expenses).
export type FinanceOverview = {
  income: number; // Nguồn thu trong kỳ (theo ngày)
  disbursed: number; // Thực chi cho người trong kỳ (theo ngày)
  regularExpense: number;
  irregularExpense: number;
  fixedCost: number;
  expenseTotal: number; // chi phí vận hành = thường + bất thường + cố định (KHÔNG gồm lương)
  actualNet: number; // Số dư thực tế = income − disbursed − expenseTotal
  accruedPayout: number; // tạm tính: Σ lương gộp từ chấm công đã duyệt
  employerInsurance: number; // tạm tính: BH phần công ty
  unpaidPayroll: number; // Đang chờ chi = Σ theo người max(0, lương net timesheet − đã thực chi)
  projectedNet: number; // Số dư dự kiến = income − accruedPayout − employerInsurance − expenseTotal
};

export async function financeOverview(period: Period): Promise<FinanceOverview> {
  const [entries, fixedCost, expenses, incomes, disb] = await Promise.all([
    approvedEntriesForPeriod(period),
    fixedCostsTotalForPeriod(period),
    prisma.expense.findMany({
      where: { date: { gte: period.start, lt: period.end } },
      select: { amount: true, kind: true },
    }),
    prisma.income.findMany({
      where: { date: { gte: period.start, lt: period.end } },
      select: { amount: true },
    }),
    prisma.disbursement.groupBy({
      by: ["userId"],
      where: { date: { gte: period.start, lt: period.end } },
      _sum: { amount: true },
    }),
  ]);

  const income = incomes.reduce((s, i) => s + i.amount, 0);
  const paidByUser = new Map(disb.map((g) => [g.userId, g._sum.amount ?? 0]));
  const disbursed = disb.reduce((s, g) => s + (g._sum.amount ?? 0), 0);
  const accruedPayout = Math.round(entries.reduce((s, e) => s + e.hours * e.costRateSnapshot, 0));
  // Đang chờ chi = timesheet NET still owed, per person, clamped ≥ 0 — so a payment to
  // someone without a timesheet (or an overpayment) doesn't cancel another person's owed.
  const unpaidPayroll = payoutByUser(entries).reduce(
    (s, r) => s + Math.max(0, r.net - (paidByUser.get(r.userId) ?? 0)),
    0,
  );
  const employerInsurance = Math.round(
    entries.reduce((s, e) => s + (e.hours * e.costRateSnapshot * e.employerCostRateSnapshot) / 10000, 0),
  );

  let regularExpense = 0;
  let irregularExpense = 0;
  for (const e of expenses) {
    if (e.kind === "IRREGULAR") irregularExpense += e.amount;
    else regularExpense += e.amount;
  }
  const expenseTotal = regularExpense + irregularExpense + fixedCost;

  return {
    income,
    disbursed,
    regularExpense,
    irregularExpense,
    fixedCost,
    expenseTotal,
    actualNet: income - disbursed - expenseTotal,
    accruedPayout,
    employerInsurance,
    unpaidPayroll,
    projectedNet: income - accruedPayout - employerInsurance - expenseTotal,
  };
}
