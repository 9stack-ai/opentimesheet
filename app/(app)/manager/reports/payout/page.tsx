import { requireManager } from "@/lib/rbac";
import { approvedEntriesForPeriod } from "@/lib/reporting-db";
import { payoutByUser } from "@/lib/reporting";
import { formatVnd } from "@/lib/money";
import { resolvePeriod, periodParam, monthPeriodOf, type PeriodSearchParams } from "@/lib/period";
import { nowSaigon } from "@/lib/clock";
import { Button } from "@/components/ui/button";
import { PayoutTable } from "./payout-table";
import { MonthPicker } from "./month-picker";
import { PeriodNav } from "@/components/reports/period-nav";

export const dynamic = "force-dynamic";

export default async function PayoutReportPage({
  searchParams,
}: {
  searchParams: Promise<PeriodSearchParams>;
}) {
  await requireManager();
  const sp = await searchParams;
  const now = nowSaigon();
  const period = resolvePeriod(sp, now);

  const rows = payoutByUser(await approvedEntriesForPeriod(period));
  const totals = rows.reduce(
    (s, r) => ({
      gross: s.gross + r.gross,
      taxWithheld: s.taxWithheld + r.taxWithheld,
      net: s.net + r.net,
      employerCost: s.employerCost + r.employerCost,
      totalCompanyCost: s.totalCompanyCost + r.totalCompanyCost,
    }),
    { gross: 0, taxWithheld: 0, net: 0, employerCost: 0, totalCompanyCost: 0 },
  );
  const ep = periodParam(period);
  const exportQuery = `${ep.key}=${ep.value}`;
  const monthValue = period.kind === "month" ? period.label : monthPeriodOf(now).label;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Chi trả CTV</h1>

      <div className="flex flex-wrap items-center gap-2">
        <PeriodNav basePath="/manager/reports/payout" period={period} now={now} />
        <MonthPicker value={monthValue} />
        <Button variant="outline" size="sm" className="ml-auto" asChild>
          <a href={`/manager/reports/payout/export?${exportQuery}`}>Xuất CSV</a>
        </Button>
      </div>

      <PayoutTable data={rows} periodQuery={exportQuery} />

      {rows.length > 0 ? (
        <div className="flex flex-col gap-1 border-t pt-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Tổng gộp (trước thuế)</span>
            <span>{formatVnd(totals.gross)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Tổng thuế giữ lại (nộp hộ)</span>
            <span>{formatVnd(totals.taxWithheld)}</span>
          </div>
          <div className="flex items-center justify-between font-medium">
            <span>Tổng thực nhận (chuyển cho người)</span>
            <span>{formatVnd(totals.net)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Tổng BH công ty đóng</span>
            <span>{formatVnd(totals.employerCost)}</span>
          </div>
          <div className="flex items-center justify-between border-t pt-1 font-semibold">
            <span>Tổng chi phí công ty</span>
            <span>{formatVnd(totals.totalCompanyCost)}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
