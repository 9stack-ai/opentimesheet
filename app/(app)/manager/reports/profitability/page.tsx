import { requireManager } from "@/lib/rbac";
import { profitabilityForPeriod } from "@/lib/profitability-db";
import { formatVnd } from "@/lib/money";
import { resolvePeriod, periodParam, type PeriodSearchParams } from "@/lib/period";
import { nowSaigon } from "@/lib/clock";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfitabilityTable } from "./profitability-table";
import type { ProfitabilityRow } from "./profitability-table";
import { PeriodNav } from "@/components/reports/period-nav";

export const dynamic = "force-dynamic";

export default async function ProfitabilityReportPage({
  searchParams,
}: {
  searchParams: Promise<PeriodSearchParams>;
}) {
  await requireManager();
  const sp = await searchParams;
  const now = nowSaigon();
  const period = resolvePeriod(sp, now);

  const { perProject, company } = await profitabilityForPeriod(period);
  // Fixed costs are allocated for every whole-month-aligned span; weekly = gross margin only.
  const allocatesFixed = period.kind !== "week";
  const ep = periodParam(period);
  const exportQuery = `${ep.key}=${ep.value}`;

  const rows: ProfitabilityRow[] = perProject.map((p) => ({
    projectId: p.projectId,
    projectName: p.projectName,
    approvedHours: p.approvedHours,
    revenue: p.revenue,
    directCost: p.directCost,
    allocatedFixed: p.allocatedFixed,
    net: p.net,
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Lợi nhuận</h1>
      <p className="-mt-4 text-xs text-muted-foreground">
        &quot;Chi phí trực tiếp&quot; gồm lương gộp + BH phần công ty + chi phí gắn dự án (thuế giữ
        lại của người lao động không tính vào — nằm trong lương gộp).
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <PeriodNav basePath="/manager/reports/profitability" period={period} now={now} />
        {allocatesFixed ? null : (
          <span className="text-xs text-muted-foreground">
            Tuần: biên lợi nhuận gộp, chưa phân bổ chi phí cố định
          </span>
        )}
        <Button variant="outline" size="sm" className="ml-auto" asChild>
          <a href={`/manager/reports/profitability/export?${exportQuery}`}>Xuất CSV</a>
        </Button>
      </div>

      <ProfitabilityTable data={rows} isMonthly={allocatesFixed} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Công ty — {allocatesFixed ? "lãi/lỗ ròng" : "biên lợi nhuận gộp"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-1 text-sm">
            <dt>Doanh thu</dt>
            <dd className="text-right">{formatVnd(company.revenue)}</dd>
            <dt>Chi phí trực tiếp</dt>
            <dd className="text-right">{formatVnd(company.directCost)}</dd>
            {allocatesFixed ? (
              <>
                <dt>Chi phí cố định</dt>
                <dd className="text-right">{formatVnd(company.totalFixed)}</dd>
              </>
            ) : null}
            <dt>Chi phí công ty</dt>
            <dd className="text-right">{formatVnd(company.companyExpenses)}</dd>
            <dt className="font-medium">Lãi/Lỗ ròng</dt>
            <dd
              className={`text-right font-medium ${company.net < 0 ? "text-destructive" : ""}`}
            >
              {formatVnd(company.net)}
            </dd>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
