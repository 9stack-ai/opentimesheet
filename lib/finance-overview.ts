import { prisma } from "@/lib/db";
import { approvedEntriesForPeriod, fixedCostsTotalForPeriod } from "@/lib/reporting-db";
import { payrollByUser } from "@/lib/payroll-accrual";
import type { Period } from "@/lib/period";

// Thu chi built from three sources:
//   • Nguồn thu (Income ledger)      → actual cash in
//   • Thực chi (Disbursement ledger) → actual cash out to people
//   • Tạm tính (approved timesheet)  → accrued payroll we still owe
// "Thực tế" = cash basis (income − disbursed − operating expenses).
// "Dự kiến" = "Thực tế" trừ tiếp phần lương CÒN NỢ người (chưa chi, clamped) và BH công ty (tạm tính).
//   Vì xuất phát từ actualNet (đã trừ MỌI khoản đã chi, kể cả người không có timesheet),
//   nó không bị "cao ảo" khi trả lương ngoài chấm công.
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
  projectedNet: number; // Số dư dự kiến = actualNet − unpaidPayroll − employerInsurance
};

export async function financeOverview(period: Period): Promise<FinanceOverview> {
  const [entries, fixedCost, expenses, incomes, disb, pay] = await Promise.all([
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
    payrollByUser(period), // approved timesheet payout per user (rate snapshotted at approval)
  ]);

  const income = incomes.reduce((s, i) => s + i.amount, 0);
  const paidByUser = new Map(disb.map((g) => [g.userId, g._sum.amount ?? 0]));
  const disbursed = disb.reduce((s, g) => s + (g._sum.amount ?? 0), 0);
  // Lương phải trả gộp = giờ công đã duyệt (timesheet), không gồm lương cố định.
  const accruedPayout = [...pay.values()].reduce((s, p) => s + p.gross, 0);
  // Đang chờ chi = NET còn nợ theo từng người, clamped ≥ 0 — khoản trả cho người không có lương
  // (hoặc trả dư) không triệt tiêu phần nợ của người khác.
  const unpaidPayroll = [...pay.entries()].reduce(
    (s, [uid, p]) => s + Math.max(0, p.net - (paidByUser.get(uid) ?? 0)),
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
  const actualNet = income - disbursed - expenseTotal;

  return {
    income,
    disbursed,
    regularExpense,
    irregularExpense,
    fixedCost,
    expenseTotal,
    actualNet,
    accruedPayout,
    employerInsurance,
    unpaidPayroll,
    // Từ tiền mặt thực có, trừ tiếp phần còn nợ người (chưa chi) và BH công ty (tạm tính).
    projectedNet: actualNet - unpaidPayroll - employerInsurance,
  };
}
