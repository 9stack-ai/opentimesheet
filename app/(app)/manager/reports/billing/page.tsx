import { requireManager } from "@/lib/rbac";
import { approvedEntriesForPeriod } from "@/lib/reporting-db";
import { billingByClient } from "@/lib/reporting";
import { formatVnd } from "@/lib/money";
import { resolvePeriod, periodParam, type PeriodSearchParams } from "@/lib/period";
import { nowSaigon } from "@/lib/clock";
import { Button } from "@/components/ui/button";
import { BillingTable } from "./billing-table";
import type { BillingRow } from "./billing-table";
import { PeriodNav } from "@/components/reports/period-nav";

export const dynamic = "force-dynamic";

export default async function BillingReportPage({
  searchParams,
}: {
  searchParams: Promise<PeriodSearchParams>;
}) {
  await requireManager();
  const sp = await searchParams;
  const now = nowSaigon();
  const period = resolvePeriod(sp, now);

  const clients = billingByClient(await approvedEntriesForPeriod(period));
  const grandTotal = clients.reduce((s, c) => s + c.revenue, 0);
  const ep = periodParam(period);
  const exportQuery = `${ep.key}=${ep.value}`;

  // Flatten client → project into plain rows for the DataTable.
  const rows: BillingRow[] = clients.flatMap((c) =>
    c.projects.map((p) => ({
      clientId: c.clientId,
      clientName: c.clientName,
      projectId: p.projectId,
      projectName: p.projectName,
      hours: p.hours,
      revenue: p.revenue,
    })),
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Doanh thu khách hàng</h1>

      <div className="flex flex-wrap items-center gap-2">
        <PeriodNav basePath="/manager/reports/billing" period={period} now={now} />
        <Button variant="outline" size="sm" className="ml-auto" asChild>
          <a href={`/manager/reports/billing/export?${exportQuery}`}>Xuất CSV</a>
        </Button>
      </div>

      <BillingTable data={rows} />

      {rows.length > 0 ? (
        <div className="flex items-center justify-between border-t pt-3 font-medium">
          <span>Tổng cộng</span>
          <span>{formatVnd(grandTotal)}</span>
        </div>
      ) : null}
    </div>
  );
}
