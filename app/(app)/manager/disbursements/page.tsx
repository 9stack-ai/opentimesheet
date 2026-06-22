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
  // Tách 2 nhóm: người CÓ chấm công (đối soát phải trả ↔ đã trả) và người chỉ nhận chi
  // ngoài timesheet (owed = 0). Trộn chung khiến cột "Còn lại" và dòng Tổng vô nghĩa.
  const withTimesheet = rows.filter((r) => r.owed > 0);
  const offTimesheet = rows.filter((r) => r.owed === 0 && r.paid > 0);
  const totals = withTimesheet.reduce(
    (s, r) => ({
      gross: s.gross + r.gross,
      tax: s.tax + r.tax,
      owed: s.owed + r.owed,
      paid: s.paid + r.paid,
      remaining: s.remaining + r.remaining,
    }),
    { gross: 0, tax: 0, owed: 0, paid: 0, remaining: 0 },
  );
  const offTotal = offTimesheet.reduce((s, r) => s + r.paid, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Thực chi</h1>
        <p className="text-sm text-muted-foreground">
          Tiền thực trả cho CTV/nhân viên. Người có chấm công được đối soát phải-trả ↔ đã-trả; người
          được trả ngoài chấm công tách riêng. Mọi vế lọc theo ngày trong kỳ đang chọn.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <PeriodNav basePath="/manager/disbursements" period={period} now={now} />
        <div className="ml-auto">
          <AddDisbursementDialog users={users} today={today} />
        </div>
      </div>

      {/* 1) Đối soát cho người CÓ chấm công: phải trả (net) vs đã trả */}
      <div>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">
          Đối soát lương (giờ công + lương cố định)
        </h2>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Người</th>
                <th className="px-3 py-2 text-left font-medium">Vai trò</th>
                <th className="px-3 py-2 text-right font-medium">Lương gộp</th>
                <th className="px-3 py-2 text-right font-medium">Thuế giữ lại</th>
                <th className="px-3 py-2 text-right font-medium">Phải trả (thực nhận)</th>
                <th className="px-3 py-2 text-right font-medium">Đã trả</th>
                <th className="px-3 py-2 text-right font-medium">Còn lại</th>
              </tr>
            </thead>
            <tbody>
              {withTimesheet.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                    Chưa có lương ghi nhận từ chấm công trong kỳ {period.label}.
                  </td>
                </tr>
              ) : (
                withTimesheet.map((r) => (
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
                    <td className="px-3 py-2 text-right">{formatVnd(r.gross)}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{formatVnd(r.tax)}</td>
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
            {withTimesheet.length > 0 ? (
              <tfoot>
                <tr className="border-t bg-muted/30 font-semibold">
                  <td className="px-3 py-2" colSpan={2}>
                    Tổng
                  </td>
                  <td className="px-3 py-2 text-right">{formatVnd(totals.gross)}</td>
                  <td className="px-3 py-2 text-right">{formatVnd(totals.tax)}</td>
                  <td className="px-3 py-2 text-right">{formatVnd(totals.owed)}</td>
                  <td className="px-3 py-2 text-right">{formatVnd(totals.paid)}</td>
                  <td className="px-3 py-2 text-right">{formatVnd(totals.remaining)}</td>
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      </div>

      {/* 2) Chi cho người KHÔNG có chấm công — không có "phải trả" để đối soát */}
      {offTimesheet.length > 0 ? (
        <div>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            Chi ngoài chấm công (người không có timesheet)
          </h2>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Người</th>
                  <th className="px-3 py-2 text-left font-medium">Vai trò</th>
                  <th className="px-3 py-2 text-right font-medium">Đã chi</th>
                </tr>
              </thead>
              <tbody>
                {offTimesheet.map((r) => (
                  <tr key={r.userId} className="border-t">
                    <td className="px-3 py-2 font-medium">{r.userName}</td>
                    <td className="px-3 py-2 text-muted-foreground">{roleLabel(r.role)}</td>
                    <td className="px-3 py-2 text-right">{formatVnd(r.paid)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t bg-muted/30 font-semibold">
                  <td className="px-3 py-2" colSpan={2}>
                    Tổng
                  </td>
                  <td className="px-3 py-2 text-right">{formatVnd(offTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Người được trả không qua chấm công nên không có &quot;phải trả&quot; để đối soát — chỉ ghi
            nhận số đã chi.
          </p>
        </div>
      ) : null}

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
