import Link from "next/link";
import { requireManager } from "@/lib/rbac";
import { financeOverview } from "@/lib/finance-overview";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseDonutChart } from "@/components/charts/expense-donut-chart";

export const dynamic = "force-dynamic";

export default async function FinanceOverviewPage({
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

  const f = await financeOverview(period);
  const breakdown = [
    { key: "payout", label: "Chi trả nhân sự", value: f.payout },
    { key: "regular", label: "Chi phí thường", value: f.regularExpense },
    { key: "irregular", label: "Chi bất thường", value: f.irregularExpense },
    { key: "fixed", label: "Chi phí cố định", value: f.fixedCost },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Tổng quan thu chi</h1>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Kỳ: {period.label}</span>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/manager/reports/finance?month=${monthPeriod(cy, cm).label}`}>Tháng này</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/manager/reports/finance?week=${weekPeriod(now).label}`}>Tuần này</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Tổng thu</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-emerald-600">{formatVnd(f.revenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Tổng chi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-rose-600">{formatVnd(f.expenseTotal)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Số dư (Thu − Chi)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-semibold ${f.net >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {formatVnd(f.net)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cơ cấu chi</CardTitle>
            <CardDescription>Phân loại các khoản chi trong kỳ.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {breakdown.map((b) => (
              <div key={b.key} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                <span className="text-muted-foreground">{b.label}</span>
                <span className="font-medium">{formatVnd(b.value)}</span>
              </div>
            ))}
            <div className="mt-1 flex items-center justify-between border-t pt-3 font-semibold">
              <span>Tổng chi</span>
              <span>{formatVnd(f.expenseTotal)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tỷ trọng chi</CardTitle>
            <CardDescription>Biểu đồ cơ cấu các khoản chi.</CardDescription>
          </CardHeader>
          <CardContent>
            <ExpenseDonutChart data={breakdown} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
