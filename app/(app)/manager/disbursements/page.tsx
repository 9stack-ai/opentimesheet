import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requireManager } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { formatVnd } from "@/lib/money";
import { roleLabel } from "@/lib/labels";
import { nowSaigon } from "@/lib/clock";
import { monthPeriodFromString, monthPeriodOf, shiftPeriod } from "@/lib/period";
import { payrollReconciliation, disbursementLedgerForMonth } from "@/lib/disbursement-db";
import { Button } from "@/components/ui/button";
import { MonthNav } from "./month-nav";
import { AddDisbursementDialog } from "./add-disbursement-dialog";
import { deleteDisbursement } from "./actions";

export const dynamic = "force-dynamic";

export default async function DisbursementsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  await requireManager();
  const sp = await searchParams;
  const now = nowSaigon();
  const period = (sp.month ? monthPeriodFromString(sp.month) : null) ?? monthPeriodOf(now);
  const monthLabel = period.label;

  const [rows, ledger, users] = await Promise.all([
    payrollReconciliation(monthLabel),
    disbursementLedgerForMonth(monthLabel),
    prisma.user.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: true },
    }),
  ]);

  const today = now.toISOString().slice(0, 10);
  const prev = shiftPeriod(period, -1).label;
  const next = shiftPeriod(period, 1).label;
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
          từng kỳ lương.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="size-8" asChild>
            <Link href={`/manager/disbursements?month=${prev}`} aria-label="Kỳ trước">
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
          <span className="min-w-20 text-center text-sm font-medium">{monthLabel}</span>
          <Button variant="outline" size="icon" className="size-8" asChild>
            <Link href={`/manager/disbursements?month=${next}`} aria-label="Kỳ sau">
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </div>
        <MonthNav value={monthLabel} />
        <div className="ml-auto">
          <AddDisbursementDialog users={users} monthLabel={monthLabel} today={today} />
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
                  Chưa có lương ghi nhận hay khoản chi nào cho kỳ {monthLabel}.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.userId} className="border-t">
                  <td className="px-3 py-2 font-medium">
                    <Link
                      href={`/manager/reports/payout/${r.userId}?month=${monthLabel}`}
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

      {/* Ledger of actual payments for the month */}
      <div>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Các khoản đã chi trong kỳ</h2>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Ngày</th>
                <th className="px-3 py-2 text-left font-medium">Người nhận</th>
                <th className="px-3 py-2 text-right font-medium">Số tiền</th>
                <th className="px-3 py-2 text-left font-medium">Ghi chú</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {ledger.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                    Chưa ghi khoản chi nào.
                  </td>
                </tr>
              ) : (
                ledger.map((d) => (
                  <tr key={d.id} className="border-t">
                    <td className="px-3 py-2">{d.date}</td>
                    <td className="px-3 py-2">{d.userName}</td>
                    <td className="px-3 py-2 text-right">{formatVnd(d.amount)}</td>
                    <td className="px-3 py-2 text-muted-foreground">{d.note ?? ""}</td>
                    <td className="px-3 py-2 text-right">
                      <form action={deleteDisbursement}>
                        <input type="hidden" name="id" value={d.id} />
                        <button type="submit" className="cursor-pointer text-destructive hover:underline">
                          Xoá
                        </button>
                      </form>
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
