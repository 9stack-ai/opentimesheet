import Link from "next/link";
import { requireManager } from "@/lib/rbac";
import { profitabilityForPeriod } from "@/lib/profitability-db";
import { formatVnd } from "@/lib/money";
import {
  monthPeriod,
  weekPeriod,
  monthPeriodFromString,
  weekPeriodFromString,
  type Period,
} from "@/lib/period";
import { nowSaigon } from "@/lib/clock";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfitabilityTable } from "./profitability-table";
import type { ProfitabilityRow } from "./profitability-table";

export const dynamic = "force-dynamic";

export default async function ProfitabilityReportPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; week?: string }>;
}) {
  await requireManager();
  const sp = await searchParams;
  const now = nowSaigon();
  const cy = now.getUTCFullYear();
  const cm = now.getUTCMonth() + 1;

  let period: Period;
  if (sp.week) period = weekPeriodFromString(sp.week) ?? weekPeriod(now);
  else if (sp.month) period = monthPeriodFromString(sp.month) ?? monthPeriod(cy, cm);
  else period = monthPeriod(cy, cm);

  const { perProject, company } = await profitabilityForPeriod(period);
  const isMonthly = period.kind === "month";
  const exportQuery = isMonthly ? `month=${period.label}` : `week=${period.label}`;

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

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Kỳ: {period.label}
          {isMonthly ? "" : " (tuần = biên lợi nhuận gộp, chưa phân bổ chi phí cố định)"}
        </span>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/manager/reports/profitability?month=${monthPeriod(cy, cm).label}`}>
            Tháng này
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/manager/reports/profitability?week=${weekPeriod(now).label}`}>
            Tuần này
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="ml-auto" asChild>
          <a href={`/manager/reports/profitability/export?${exportQuery}`}>Xuất CSV</a>
        </Button>
      </div>

      <ProfitabilityTable data={rows} isMonthly={isMonthly} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Công ty — {isMonthly ? "lãi/lỗ ròng" : "biên lợi nhuận gộp"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-1 text-sm">
            <dt>Doanh thu</dt>
            <dd className="text-right">{formatVnd(company.revenue)}</dd>
            <dt>Chi phí trực tiếp</dt>
            <dd className="text-right">{formatVnd(company.directCost)}</dd>
            {isMonthly ? (
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
