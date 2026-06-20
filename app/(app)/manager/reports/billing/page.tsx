import Link from "next/link";
import { requireManager } from "@/lib/rbac";
import { approvedEntriesForPeriod } from "@/lib/reporting-db";
import { billingByClient } from "@/lib/reporting";
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

export const dynamic = "force-dynamic";

export default async function BillingReportPage({
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

  const clients = billingByClient(await approvedEntriesForPeriod(period));
  const grandTotal = clients.reduce((s, c) => s + c.revenue, 0);
  const exportQuery = period.kind === "week" ? `week=${period.label}` : `month=${period.label}`;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Doanh thu khách hàng</h1>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Kỳ: {period.label}</span>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/manager/reports/billing?month=${monthPeriod(cy, cm).label}`}>Tháng này</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/manager/reports/billing?week=${weekPeriod(now).label}`}>Tuần này</Link>
        </Button>
        <Button variant="outline" size="sm" className="ml-auto" asChild>
          <a href={`/manager/reports/billing/export?${exportQuery}`}>Xuất CSV</a>
        </Button>
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-muted-foreground">
            Không có doanh thu nào trong kỳ này.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {clients.map((c) => (
            <Card key={c.clientId}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{c.clientName}</span>
                  <span>{formatVnd(c.revenue)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                  {c.projects.map((p) => (
                    <li key={p.projectId} className="flex items-center justify-between">
                      <span>
                        {p.projectName} · {p.hours} giờ
                      </span>
                      <span>{formatVnd(p.revenue)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}

          <div className="flex items-center justify-between border-t pt-3 font-medium">
            <span>Tổng cộng</span>
            <span>{formatVnd(grandTotal)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
