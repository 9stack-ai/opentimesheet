import { prisma } from "@/lib/db";
import { formatISODate, type Period } from "@/lib/period";
import { approvedEntriesForPeriod } from "@/lib/reporting-db";
import { payoutByUser } from "@/lib/reporting";

export type PayrollRow = {
  userId: string;
  userName: string;
  role: string;
  gross: number; // lương gộp (trước thuế) từ chấm công đã duyệt trong kỳ
  tax: number; // thuế TNCN giữ lại trong kỳ
  owed: number; // net (thực nhận) = gross − tax
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

  const payoutByUserId = new Map(payoutByUser(entries).map((r) => [r.userId, r]));
  const paidByUser = new Map(paidAgg.map((p) => [p.userId, p._sum.amount ?? 0]));
  const userInfo = new Map(users.map((u) => [u.id, u]));

  const rows: PayrollRow[] = [];
  for (const id of new Set([...payoutByUserId.keys(), ...paidByUser.keys()])) {
    const pay = payoutByUserId.get(id);
    const owed = pay?.net ?? 0;
    const paid = paidByUser.get(id) ?? 0;
    const u = userInfo.get(id);
    rows.push({
      userId: id,
      userName: u?.name ?? "(đã xoá)",
      role: u?.role ?? "",
      gross: pay?.gross ?? 0,
      tax: pay?.taxWithheld ?? 0,
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

export type LifetimeBalance = {
  netOwed: number; // Σ thực nhận (net) từ MỌI công đã duyệt (toàn thời gian)
  paid: number; // Σ đã thực chi cho người này (toàn thời gian)
  remaining: number; // còn chưa nhận = max(0, netOwed − paid)
};

/** All-time net owed vs paid for one person — the true outstanding balance (không phụ thuộc kỳ),
 *  dùng cho phần "công nợ luỹ kế" ở màn hình cá nhân. Net = round(Σ gross) − round(Σ tax). */
export async function lifetimeBalanceForUser(userId: string): Promise<LifetimeBalance> {
  const [entries, paidAgg] = await Promise.all([
    prisma.timeEntry.findMany({
      where: { userId, status: "APPROVED" },
      select: { hours: true, costRateSnapshot: true, taxRateSnapshot: true },
    }),
    prisma.disbursement.aggregate({ where: { userId }, _sum: { amount: true } }),
  ]);
  const grossRaw = entries.reduce((s, e) => s + Number(e.hours) * (e.costRateSnapshot ?? 0), 0);
  const taxRaw = entries.reduce(
    (s, e) => s + (Number(e.hours) * (e.costRateSnapshot ?? 0) * (e.taxRateSnapshot ?? 0)) / 10000,
    0,
  );
  const netOwed = Math.round(grossRaw) - Math.round(taxRaw);
  const paid = paidAgg._sum.amount ?? 0;
  return { netOwed, paid, remaining: Math.max(0, netOwed - paid) };
}
