import { prisma } from "@/lib/db";
import { formatISODate, type Period } from "@/lib/period";
import { approvedEntriesForPeriod } from "@/lib/reporting-db";
import { payoutByUser } from "@/lib/reporting";

export type PayrollRow = {
  userId: string;
  userName: string;
  role: string;
  owed: number; // net (thực nhận) accrued from approved timesheet in the period
  paid: number; // Σ actual disbursements in the period (by payment date)
  remaining: number; // owed − paid
};

/** Reconcile accrued net pay (from approved timesheet) against actual disbursements over
 *  a period (any kind). Both sides filter by date in [start, end). Includes anyone owed OR paid. */
export async function payrollReconciliation(period: Period): Promise<PayrollRow[]> {
  const [entries, paidAgg, users] = await Promise.all([
    approvedEntriesForPeriod(period),
    prisma.disbursement.groupBy({
      by: ["userId"],
      where: { date: { gte: period.start, lt: period.end } },
      _sum: { amount: true },
    }),
    prisma.user.findMany({ select: { id: true, name: true, role: true } }),
  ]);

  const owedByUser = new Map(payoutByUser(entries).map((r) => [r.userId, r.net]));
  const paidByUser = new Map(paidAgg.map((p) => [p.userId, p._sum.amount ?? 0]));
  const userInfo = new Map(users.map((u) => [u.id, u]));

  const rows: PayrollRow[] = [];
  for (const id of new Set([...owedByUser.keys(), ...paidByUser.keys()])) {
    const owed = owedByUser.get(id) ?? 0;
    const paid = paidByUser.get(id) ?? 0;
    const u = userInfo.get(id);
    rows.push({
      userId: id,
      userName: u?.name ?? "(đã xoá)",
      role: u?.role ?? "",
      owed,
      paid,
      remaining: owed - paid,
    });
  }
  return rows.sort((a, b) => a.userName.localeCompare(b.userName));
}

export type DisbursementRow = {
  id: string;
  date: string;
  periodLabel: string; // salary month settled ("YYYY-MM")
  userId: string;
  userName: string;
  amount: number;
  note: string | null;
};

/** Actual-payment ledger over a period (by payment date). */
export async function disbursementLedgerForPeriod(period: Period): Promise<DisbursementRow[]> {
  const rows = await prisma.disbursement.findMany({
    where: { date: { gte: period.start, lt: period.end } },
    orderBy: { date: "desc" },
    include: { user: { select: { name: true } } },
  });
  return rows.map((d) => ({
    id: d.id,
    date: formatISODate(d.date),
    periodLabel: d.periodLabel,
    userId: d.userId,
    userName: d.user.name,
    amount: d.amount,
    note: d.note,
  }));
}

/** Total actually paid to a user across all month-labels within an arbitrary report period. */
export async function paidToUserInPeriod(userId: string, period: Period): Promise<number> {
  const agg = await prisma.disbursement.aggregate({
    where: { userId, date: { gte: period.start, lt: period.end } },
    _sum: { amount: true },
  });
  return agg._sum.amount ?? 0;
}
