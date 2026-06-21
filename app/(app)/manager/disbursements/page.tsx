import Link from "next/link";
import { requireManager } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { formatVnd } from "@/lib/money";
import { roleLabel } from "@/lib/labels";
import { nowSaigon } from "@/lib/clock";
import { resolvePeriod, periodParam, type PeriodSearchParams } from "@/lib/period";
import { payrollReconciliation, disbursementLedgerForPeriod } from "@/lib/disbursement-db";
import { PeriodNav } from "@/components/reports/period-nav";
import { AddDisbursementDialog } from "./add-disbursement-dialog";
import { DisbursementRowActions } from "./disbursement-row-actions";

export const dynamic = "force-dynamic";

export default async function DisbursementsPage({
  searchParams,
}: {
  searchParams: Promise<PeriodSearchParams>;
}) {
  await requireManager();
  const sp = await searchParams;
  const now = nowSaigon();
  const period = resolvePeriod(sp, now);
  const ep = periodParam(period);

  const [rows, ledger, users] = await Promise.all([
    payrollReconciliation(period),
    disbursementLedgerForPeriod(period),
    prisma.user.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: true },
    }),
  ]);

  const today = now.toISOString().slice(0, 10);
  const totals = rows.reduce(
    (s, r) => ({ owed: s.owed + r.owed, paid: s.paid + r.paid, remaining: s.remaining + r.remaining }),
    { owed: 0, paid: 0, remaining: 0 },
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Thực chi</h1>
        <p className="text-sm text-muted-foreground">
          Tiền thực trả cho CTV/nhân viên, đối soát với lương ghi nhận từ chấm công (đã duyệt) theo
          kỳ. Cả hai vế lọc theo ngày trong kỳ đang chọn.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <PeriodNav basePath="/manager/disbursements" period={period} now={now} />
        <div className="ml-auto">
          <AddDisbursementDialog users={users} today={today} />
        </div>
      </div>

      {/* Reconciliation: accrued net (phải trả) vs actually paid */}
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Người</th>
              <th className="px-3 py-2 text-left font-medium">Vai trò</th>
              <th className="px-3 py-2 text-right font-medium">Phải trả (thực nhận)</th>
              <th className="px-3 py-2 text-right font-medium">Đã trả</th>
              <th className="px-3 py-2 text-right font-medium">Còn lại</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  Chưa có lương ghi nhận hay khoản chi nào trong kỳ {period.label}.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.userId} className="border-t">
                  <td className="px-3 py-2 font-medium">
                    <Link
                      href={`/manager/reports/payout/${r.userId}?${ep.key}=${ep.value}`}
                      className="hover:underline"
                    >
                      {r.userName}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{roleLabel(r.role)}</td>
                  <td className="px-3 py-2 text-right">{formatVnd(r.owed)}</td>
                  <td className="px-3 py-2 text-right">{formatVnd(r.paid)}</td>
                  <td
                    className={`px-3 py-2 text-right font-medium ${
                      r.remaining > 0 ? "text-amber-600" : r.remaining < 0 ? "text-rose-600" : "text-emerald-600"
                    }`}
                  >
                    {formatVnd(r.remaining)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {rows.length > 0 ? (
            <tfoot>
              <tr className="border-t bg-muted/30 font-semibold">
                <td className="px-3 py-2" colSpan={2}>
                  Tổng
                </td>
                <td className="px-3 py-2 text-right">{formatVnd(totals.owed)}</td>
                <td className="px-3 py-2 text-right">{formatVnd(totals.paid)}</td>
                <td className="px-3 py-2 text-right">{formatVnd(totals.remaining)}</td>
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      {/* Ledger of actual payments in the period */}
      <div>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Các khoản đã chi trong kỳ</h2>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Ngày</th>
                <th className="px-3 py-2 text-left font-medium">Người nhận</th>
                <th className="px-3 py-2 text-left font-medium">Kỳ lương</th>
                <th className="px-3 py-2 text-right font-medium">Số tiền</th>
                <th className="px-3 py-2 text-left font-medium">Ghi chú</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {ledger.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                    Chưa ghi khoản chi nào.
                  </td>
                </tr>
              ) : (
                ledger.map((d) => (
                  <tr key={d.id} className="border-t">
                    <td className="px-3 py-2">{d.date}</td>
                    <td className="px-3 py-2">{d.userName}</td>
                    <td className="px-3 py-2 text-muted-foreground">{d.periodLabel}</td>
                    <td className="px-3 py-2 text-right">{formatVnd(d.amount)}</td>
                    <td className="px-3 py-2 text-muted-foreground">{d.note ?? ""}</td>
                    <td className="px-3 py-2 text-right">
                      <DisbursementRowActions disbursement={d} users={users} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
