import Link from "next/link";
import { requireManager } from "@/lib/rbac";
import { approvedEntriesForPeriod } from "@/lib/reporting-db";
import { payoutByUser } from "@/lib/reporting";
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
import { PayoutTable } from "./payout-table";

export const dynamic = "force-dynamic";

export default async function PayoutReportPage({
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

  const rows = payoutByUser(await approvedEntriesForPeriod(period));
  const grandTotal = rows.reduce((s, r) => s + r.payout, 0);
  const exportQuery = period.kind === "week" ? `week=${period.label}` : `month=${period.label}`;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Chi trả CTV</h1>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Kỳ: {period.label}</span>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/manager/reports/payout?month=${monthPeriod(cy, cm).label}`}>Tháng này</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/manager/reports/payout?week=${weekPeriod(now).label}`}>Tuần này</Link>
        </Button>
        <Button variant="outline" size="sm" className="ml-auto" asChild>
          <a href={`/manager/reports/payout/export?${exportQuery}`}>Xuất CSV</a>
        </Button>
      </div>

      <PayoutTable data={rows} />

      {rows.length > 0 ? (
        <div className="flex items-center justify-between border-t pt-3 font-medium">
          <span>Tổng cộng</span>
          <span>{formatVnd(grandTotal)}</span>
        </div>
      ) : null}
    </div>
  );
}
